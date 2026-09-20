import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import oracledb from 'oracledb';
import type { AttendanceCheckPayload, AttendanceQueryDto } from '@app/dto';
import { OracleService } from '../oracle/oracle.service';
import {
  ADD_LONGITUDE_COLUMNS,
  CREATE_ATTENDANCE_TABLE,
  REBUILD_STATUS_CONSTRAINT,
} from './attendance.schema';

/** Shape of an ATTENDANCE row as returned by Oracle (OUT_FORMAT_OBJECT). */
interface AttendanceRow {
  ID: number;
  USER_ID: number;
  ATTENDANCE_DATE: Date;
  CHECK_IN: Date | null;
  CHECK_OUT: Date | null;
  PHOTO_CHECK_IN: string | null;
  PHOTO_CHECK_OUT: string | null;
  LATITUDE_CHECK_IN: number | null;
  LATITUDE_CHECK_OUT: number | null;
  LONGITUDE_CHECK_IN: number | null;
  LONGITUDE_CHECK_OUT: number | null;
  NOTE_CHECK_IN: string | null;
  NOTE_CHECK_OUT: string | null;
  STATUS: string;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

/** camelCase attendance record returned to the gateway/frontend. */
export interface AttendanceDto {
  id: number;
  userId: number;
  attendanceDate: string;
  checkIn: string | null;
  photoCheckIn: string | null;
  latitudeCheckIn: number | null;
  longitudeCheckIn: number | null;
  noteCheckIn: string | null;
  checkOut: string | null;
  photoCheckOut: string | null;
  latitudeCheckOut: number | null;
  longitudeCheckOut: number | null;
  noteCheckOut: string | null;
  status: string;
}

@Injectable()
export class AttendanceService implements OnModuleInit {
  private readonly logger = new Logger(AttendanceService.name);
  // Hour of day (server time) at/after which a check-in is considered LATE.
  // Configurable via ATTENDANCE_LATE_HOUR (defaults to 9 = 09:00).
  private readonly lateThresholdHour: number;

  constructor(
    private readonly oracle: OracleService,
    private readonly config: ConfigService,
  ) {
    const raw = Number(this.config.get<string>('ATTENDANCE_LATE_HOUR', '9'));
    this.lateThresholdHour =
      Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : 9;
  }

  async onModuleInit(): Promise<void> {
    // Ensure the ATTENDANCE table exists (idempotent).
    await this.oracle.execute(CREATE_ATTENDANCE_TABLE);
    // Add longitude columns for older tables (idempotent).
    await this.oracle.execute(ADD_LONGITUDE_COLUMNS);
    // Remove 'LEAVE' from the status CHECK constraint (idempotent).
    await this.oracle.execute(REBUILD_STATUS_CONSTRAINT);
    this.logger.log('ATTENDANCE table verified/created');
  }

  // ------------------------------------------------------------------
  // Check-in
  // ------------------------------------------------------------------
  async checkIn(payload: AttendanceCheckPayload): Promise<AttendanceDto> {
    const now = new Date();

    // One record per user per day: reject a second check-in today.
    const existing = await this.findTodayRow(payload.userId, now);
    if (existing && existing.CHECK_IN) {
      throw new ConflictException('Employee has already checked in today');
    }

    const status =
      now.getHours() >= this.lateThresholdHour ? 'LATE' : 'PRESENT';

    const sql = `
      INSERT INTO ATTENDANCE (
        USER_ID, ATTENDANCE_DATE, CHECK_IN,
        PHOTO_CHECK_IN, LATITUDE_CHECK_IN, LONGITUDE_CHECK_IN,
        NOTE_CHECK_IN, STATUS
      ) VALUES (
        :userId, TRUNC(:attDate), :checkIn,
        :photo, :latitude, :longitude, :note, :status
      )
      RETURNING ID INTO :outId
    `;

    const result = await this.oracle.execute<never>(sql, {
      userId: payload.userId,
      attDate: now,
      checkIn: now,
      photo: payload.photoPath,
      latitude: payload.latitude,
      longitude: payload.longitude ?? null,
      note: payload.note ?? null,
      status,
      outId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    });

    const outBinds = result.outBinds as { outId: number[] } | undefined;
    const newId = outBinds?.outId?.[0];
    this.logger.log(
      `Check-in success userId=${payload.userId} id=${newId} status=${status}`,
    );

    const row = await this.findById(newId as number);
    return this.mapRow(row);
  }

  // ------------------------------------------------------------------
  // Check-out
  // ------------------------------------------------------------------
  async checkOut(payload: AttendanceCheckPayload): Promise<AttendanceDto> {
    const now = new Date();

    const existing = await this.findTodayRow(payload.userId, now);
    if (!existing || !existing.CHECK_IN) {
      throw new BadRequestException('Employee has not checked in today');
    }
    if (existing.CHECK_OUT) {
      throw new ConflictException('Employee has already checked out today');
    }

    const sql = `
      UPDATE ATTENDANCE SET
        CHECK_OUT = :checkOut,
        PHOTO_CHECK_OUT = :photo,
        LATITUDE_CHECK_OUT = :latitude,
        LONGITUDE_CHECK_OUT = :longitude,
        NOTE_CHECK_OUT = :note,
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = :id
    `;

    await this.oracle.execute(sql, {
      checkOut: now,
      photo: payload.photoPath,
      latitude: payload.latitude,
      longitude: payload.longitude ?? null,
      note: payload.note ?? null,
      id: existing.ID,
    });

    this.logger.log(
      `Check-out success userId=${payload.userId} id=${existing.ID}`,
    );

    const row = await this.findById(existing.ID);
    return this.mapRow(row);
  }

  // ------------------------------------------------------------------
  // Mark absent
  // ------------------------------------------------------------------
  /**
   * Mark the given users as ABSENT for a date, but only those without an
   * existing attendance record that day (idempotent). Returns how many were
   * newly marked. `date` is 'YYYY-MM-DD'.
   */
  async markAbsent(
    userIds: number[],
    date: string,
  ): Promise<{ date: string; marked: number; skipped: number }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { date, marked: 0, skipped: 0 };
    }

    let marked = 0;
    let skipped = 0;

    for (const userId of userIds) {
      // Skip if a record already exists for this user + date.
      const existing = await this.oracle.execute<{ CNT: number }>(
        `SELECT COUNT(*) AS CNT FROM ATTENDANCE
         WHERE USER_ID = :userId AND ATTENDANCE_DATE = TO_DATE(:d, 'YYYY-MM-DD')`,
        { userId, d: date },
      );
      if ((existing.rows?.[0]?.CNT ?? 0) > 0) {
        skipped += 1;
        continue;
      }

      await this.oracle.execute(
        `INSERT INTO ATTENDANCE (USER_ID, ATTENDANCE_DATE, STATUS)
         VALUES (:userId, TO_DATE(:d, 'YYYY-MM-DD'), 'ABSENT')`,
        { userId, d: date },
      );
      marked += 1;
    }

    this.logger.log(
      `Marked ABSENT date=${date} marked=${marked} skipped=${skipped}`,
    );
    return { date, marked, skipped };
  }

  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------
  async findMine(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceDto[]> {
    const binds: oracledb.BindParameters = { userId };
    let sql = `SELECT * FROM ATTENDANCE WHERE USER_ID = :userId`;

    if (startDate) {
      sql += ` AND ATTENDANCE_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
      (binds as Record<string, unknown>).startDate = startDate;
    }
    if (endDate) {
      sql += ` AND ATTENDANCE_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      (binds as Record<string, unknown>).endDate = endDate;
    }
    sql += ` ORDER BY ATTENDANCE_DATE DESC`;

    const result = await this.oracle.execute<AttendanceRow>(sql, binds);
    return (result.rows ?? []).map((r) => this.mapRow(r));
  }

  async findAll(query: AttendanceQueryDto): Promise<AttendanceDto[]> {
    const binds: oracledb.BindParameters = {};
    const clauses: string[] = [];

    if (query.userId !== undefined) {
      clauses.push('USER_ID = :userId');
      binds.userId = query.userId;
    }
    if (query.startDate) {
      clauses.push(`ATTENDANCE_DATE >= TO_DATE(:startDate, 'YYYY-MM-DD')`);
      binds.startDate = query.startDate;
    }
    if (query.endDate) {
      clauses.push(`ATTENDANCE_DATE <= TO_DATE(:endDate, 'YYYY-MM-DD')`);
      binds.endDate = query.endDate;
    }
    if (query.status) {
      clauses.push('STATUS = :status');
      binds.status = query.status;
    }

    let sql = `SELECT * FROM ATTENDANCE`;
    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ` ORDER BY ATTENDANCE_DATE DESC, USER_ID ASC`;

    const result = await this.oracle.execute<AttendanceRow>(sql, binds);
    return (result.rows ?? []).map((r) => this.mapRow(r));
  }

  async findOne(id: number): Promise<AttendanceDto> {
    const row = await this.findById(id);
    return this.mapRow(row);
  }

  /** Today's summary counts for the HRD dashboard. */
  async summaryToday(): Promise<{
    date: string;
    total: number;
    checkedIn: number;
    checkedOut: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) AS TOTAL,
        COUNT(CHECK_IN) AS CHECKED_IN,
        COUNT(CHECK_OUT) AS CHECKED_OUT
      FROM ATTENDANCE
      WHERE ATTENDANCE_DATE = TRUNC(CURRENT_DATE)
    `;
    const result = await this.oracle.execute<{
      TOTAL: number;
      CHECKED_IN: number;
      CHECKED_OUT: number;
    }>(sql);
    const row = result.rows?.[0];
    return {
      date: this.formatDate(new Date()),
      total: row?.TOTAL ?? 0,
      checkedIn: row?.CHECKED_IN ?? 0,
      checkedOut: row?.CHECKED_OUT ?? 0,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  private async findTodayRow(
    userId: number,
    now: Date,
  ): Promise<AttendanceRow | null> {
    const sql = `
      SELECT * FROM ATTENDANCE
      WHERE USER_ID = :userId AND ATTENDANCE_DATE = TRUNC(:attDate)
    `;
    const result = await this.oracle.execute<AttendanceRow>(sql, {
      userId,
      attDate: now,
    });
    return result.rows?.[0] ?? null;
  }

  private async findById(id: number): Promise<AttendanceRow> {
    const result = await this.oracle.execute<AttendanceRow>(
      `SELECT * FROM ATTENDANCE WHERE ID = :id`,
      { id },
    );
    const row = result.rows?.[0];
    if (!row) {
      throw new NotFoundException(`Attendance with id ${id} not found`);
    }
    return row;
  }

  private mapRow(row: AttendanceRow): AttendanceDto {
    return {
      id: row.ID,
      userId: row.USER_ID,
      attendanceDate: this.formatDate(row.ATTENDANCE_DATE),
      checkIn: this.toIso(row.CHECK_IN),
      photoCheckIn: row.PHOTO_CHECK_IN,
      latitudeCheckIn: row.LATITUDE_CHECK_IN,
      longitudeCheckIn: row.LONGITUDE_CHECK_IN,
      noteCheckIn: row.NOTE_CHECK_IN,
      checkOut: this.toIso(row.CHECK_OUT),
      photoCheckOut: row.PHOTO_CHECK_OUT,
      latitudeCheckOut: row.LATITUDE_CHECK_OUT,
      longitudeCheckOut: row.LONGITUDE_CHECK_OUT,
      noteCheckOut: row.NOTE_CHECK_OUT,
      status: row.STATUS,
    };
  }

  private toIso(value: Date | null): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  private formatDate(value: Date): string {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
