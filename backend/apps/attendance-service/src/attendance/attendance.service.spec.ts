import { BadRequestException, ConflictException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

/**
 * The service issues several SQL statements. We drive behavior by matching on
 * fragments of the SQL string passed to OracleService.execute.
 */
describe('AttendanceService', () => {
  let service: AttendanceService;
  let oracle: { execute: jest.Mock };

  const payload = {
    userId: 100,
    latitude: -6.4,
    note: 'test',
    photoPath: '/uploads/attendance/100/x.jpg',
  };

  const sampleRow = {
    ID: 1,
    USER_ID: 100,
    ATTENDANCE_DATE: new Date('2026-09-18'),
    CHECK_IN: new Date('2026-09-18T08:00:00Z'),
    CHECK_OUT: null,
    PHOTO_CHECK_IN: '/uploads/attendance/100/x.jpg',
    PHOTO_CHECK_OUT: null,
    LATITUDE_CHECK_IN: -6.4,
    LATITUDE_CHECK_OUT: null,
    NOTE_CHECK_IN: 'test',
    NOTE_CHECK_OUT: null,
    STATUS: 'PRESENT',
    CREATED_AT: new Date(),
    UPDATED_AT: new Date(),
  };

  beforeEach(() => {
    oracle = { execute: jest.fn() };
    service = new AttendanceService(oracle as never);
  });

  it('checks in successfully when there is no record today', async () => {
    oracle.execute.mockImplementation((sql: string) => {
      if (sql.includes('SELECT * FROM ATTENDANCE') && sql.includes('TRUNC')) {
        return { rows: [] }; // no record today
      }
      if (sql.includes('INSERT INTO ATTENDANCE')) {
        return { outBinds: { outId: [1] } };
      }
      if (sql.includes('WHERE ID = :id')) {
        return { rows: [sampleRow] };
      }
      return { rows: [] };
    });

    const result = await service.checkIn(payload);
    expect(result.id).toBe(1);
    expect(result.userId).toBe(100);
    expect(result.photoCheckIn).toBe('/uploads/attendance/100/x.jpg');
  });

  it('rejects a duplicate check-in with 409', async () => {
    oracle.execute.mockImplementation((sql: string) => {
      if (sql.includes('SELECT * FROM ATTENDANCE') && sql.includes('TRUNC')) {
        return { rows: [{ ...sampleRow }] }; // already checked in
      }
      return { rows: [] };
    });

    await expect(service.checkIn(payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects check-out before check-in with 400', async () => {
    oracle.execute.mockResolvedValue({ rows: [] }); // no record today
    await expect(service.checkOut(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('checks out successfully after check-in', async () => {
    oracle.execute.mockImplementation((sql: string) => {
      if (sql.includes('SELECT * FROM ATTENDANCE') && sql.includes('TRUNC')) {
        return { rows: [{ ...sampleRow, CHECK_OUT: null }] };
      }
      if (sql.includes('UPDATE ATTENDANCE')) {
        return { rowsAffected: 1 };
      }
      if (sql.includes('WHERE ID = :id')) {
        return {
          rows: [{ ...sampleRow, CHECK_OUT: new Date('2026-09-18T17:00:00Z') }],
        };
      }
      return { rows: [] };
    });

    const result = await service.checkOut(payload);
    expect(result.checkOut).not.toBeNull();
  });

  it('rejects a duplicate check-out with 409', async () => {
    oracle.execute.mockImplementation((sql: string) => {
      if (sql.includes('SELECT * FROM ATTENDANCE') && sql.includes('TRUNC')) {
        return {
          rows: [{ ...sampleRow, CHECK_OUT: new Date('2026-09-18T17:00:00Z') }],
        };
      }
      return { rows: [] };
    });

    await expect(service.checkOut(payload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
