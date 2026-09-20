import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import {
  ATTENDANCE_GEOFENCE_METERS,
  ATTENDANCE_PATTERNS,
  EMPLOYEE_PATTERNS,
  haversineMeters,
  Role,
} from '@app/common';
import { AttendanceActionDto, AttendanceQueryDto } from '@app/dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@app/auth';
import type { AuthenticatedUser } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';
import {
  MAX_PHOTO_BYTES,
  photoFileFilter,
  saveAttendancePhoto,
} from './photo-upload.util';

interface UploadedPhoto {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

interface AttendanceRecord {
  userId: number;
  [key: string]: unknown;
}

interface EmployeeProfile {
  id: number;
  userId: number;
  latitude: number | null;
  longitude: number | null;
  [key: string]: unknown;
}

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/attendance')
export class AttendanceController {
  constructor(
    private readonly rpc: RpcClientService,
    private readonly config: ConfigService,
  ) {}

  @Post('check-in')
  @Roles(Role.EMPLOYEE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        latitude: { type: 'number', example: -6.4024842 },
        longitude: { type: 'number', example: 106.8456 },
        note: { type: 'string', example: 'Datang ke kantor' },
      },
      required: ['photo', 'latitude', 'longitude'],
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_PHOTO_BYTES },
      fileFilter: photoFileFilter,
    }),
  )
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() photo: UploadedPhoto,
    @Body() dto: AttendanceActionDto,
  ) {
    // Enforce the geofence before persisting anything.
    await this.assertWithinGeofence(user.sub, dto.latitude, dto.longitude);

    const photoPath = await saveAttendancePhoto({
      uploadDir: this.config.get<string>('UPLOAD_DIR', 'uploads'),
      userId: user.sub,
      kind: 'checkin',
      file: photo,
    });
    return this.rpc.send('attendance', ATTENDANCE_PATTERNS.CHECK_IN, {
      userId: user.sub,
      latitude: dto.latitude,
      longitude: dto.longitude,
      note: dto.note,
      photoPath,
    });
  }

  @Post('check-out')
  @Roles(Role.EMPLOYEE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        latitude: { type: 'number', example: -6.4025001 },
        longitude: { type: 'number', example: 106.8456 },
        note: { type: 'string', example: 'Selesai bekerja' },
      },
      required: ['photo', 'latitude', 'longitude'],
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_PHOTO_BYTES },
      fileFilter: photoFileFilter,
    }),
  )
  async checkOut(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() photo: UploadedPhoto,
    @Body() dto: AttendanceActionDto,
  ) {
    // Enforce the geofence before persisting anything.
    await this.assertWithinGeofence(user.sub, dto.latitude, dto.longitude);

    const photoPath = await saveAttendancePhoto({
      uploadDir: this.config.get<string>('UPLOAD_DIR', 'uploads'),
      userId: user.sub,
      kind: 'checkout',
      file: photo,
    });
    return this.rpc.send('attendance', ATTENDANCE_PATTERNS.CHECK_OUT, {
      userId: user.sub,
      latitude: dto.latitude,
      longitude: dto.longitude,
      note: dto.note,
      photoPath,
    });
  }

  /** Current employee's own attendance history (optional date range). */
  @Get('me')
  myAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.rpc.send('attendance', ATTENDANCE_PATTERNS.LIST_ME, {
      userId: user.sub,
      startDate,
      endDate,
    });
  }

  /**
   * HRD: mark employees who have no attendance record on a date as ABSENT.
   * Body: { date?: 'YYYY-MM-DD' } — defaults to today.
   */
  @Post('mark-absent')
  @Roles(Role.HRD)
  async markAbsent(@Body() body: { date?: string }) {
    const date = body?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : this.today();
    const userIds = await this.rpc.send<number[]>(
      'employee',
      EMPLOYEE_PATTERNS.EMPLOYEE_USER_IDS,
      {},
    );
    return this.rpc.send('attendance', ATTENDANCE_PATTERNS.MARK_ABSENT, {
      userIds,
      date,
    });
  }

  /** HRD: list all attendance, enriched with employee info. */
  @Get()
  @Roles(Role.HRD)
  async listAll(@Query() query: AttendanceQueryDto) {
    const records = await this.rpc.send<AttendanceRecord[]>(
      'attendance',
      ATTENDANCE_PATTERNS.LIST_ALL,
      query,
    );
    return this.enrichWithEmployees(records);
  }

  @Get(':id')
  @Roles(Role.HRD)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.rpc.send<AttendanceRecord>(
      'attendance',
      ATTENDANCE_PATTERNS.GET,
      { id },
    );
    const [enriched] = await this.enrichWithEmployees([record]);
    return enriched;
  }

  /**
   * For HRD views, attach the employee profile (name, employeeNo, department,
   * position) to each attendance record by resolving employee.userId.
   */
  private async enrichWithEmployees(
    records: AttendanceRecord[],
  ): Promise<unknown[]> {
    if (!records || records.length === 0) {
      return records ?? [];
    }

    const uniqueUserIds = [...new Set(records.map((r) => r.userId))];
    const employeeByUserId = new Map<number, unknown>();

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const employee = await this.rpc.send(
            'employee',
            EMPLOYEE_PATTERNS.EMPLOYEE_GET_BY_USER,
            { userId },
          );
          employeeByUserId.set(userId, employee);
        } catch {
          // Employee profile may not exist for this userId; leave as null.
          employeeByUserId.set(userId, null);
        }
      }),
    );

    return records.map((record) => ({
      ...record,
      employee: employeeByUserId.get(record.userId) ?? null,
    }));
  }

  /** Server-side today as YYYY-MM-DD. */
  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Geofence check: the check-in/out coordinate must be within
   * ATTENDANCE_GEOFENCE_METERS of the employee's registered location.
   * Throws if the employee profile / location is missing or too far away.
   */
  private async assertWithinGeofence(
    userId: number,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    let employee: EmployeeProfile;
    try {
      employee = await this.rpc.send<EmployeeProfile>(
        'employee',
        EMPLOYEE_PATTERNS.EMPLOYEE_GET_BY_USER,
        { userId },
      );
    } catch {
      throw new BadRequestException(
        'Employee profile not found. Please contact HRD.',
      );
    }

    if (
      employee.latitude === null ||
      employee.longitude === null ||
      employee.latitude === undefined ||
      employee.longitude === undefined
    ) {
      throw new BadRequestException(
        'Your registered work location is not set. Please contact HRD.',
      );
    }

    const distance = haversineMeters(
      Number(employee.latitude),
      Number(employee.longitude),
      latitude,
      longitude,
    );

    if (distance > ATTENDANCE_GEOFENCE_METERS) {
      throw new ForbiddenException(
        `You are ${Math.round(distance)} m from your registered location. ` +
          `Attendance is only allowed within ${ATTENDANCE_GEOFENCE_METERS} m.`,
      );
    }
  }
}
