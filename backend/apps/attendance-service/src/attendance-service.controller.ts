import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ATTENDANCE_PATTERNS } from '@app/common';
import type { AttendanceCheckPayload, AttendanceQueryDto } from '@app/dto';
import { AttendanceService } from './attendance/attendance.service';
import { OracleService } from './oracle/oracle.service';

@Controller()
export class AttendanceServiceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly oracleService: OracleService,
  ) {}

  @MessagePattern(ATTENDANCE_PATTERNS.CHECK_IN)
  checkIn(@Payload() payload: AttendanceCheckPayload) {
    return this.attendanceService.checkIn(payload);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.CHECK_OUT)
  checkOut(@Payload() payload: AttendanceCheckPayload) {
    return this.attendanceService.checkOut(payload);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.LIST_ME)
  listMine(
    @Payload()
    data: { userId: number; startDate?: string; endDate?: string },
  ) {
    return this.attendanceService.findMine(
      data.userId,
      data.startDate,
      data.endDate,
    );
  }

  @MessagePattern(ATTENDANCE_PATTERNS.LIST_ALL)
  listAll(@Payload() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.GET)
  getOne(@Payload() data: { id: number }) {
    return this.attendanceService.findOne(data.id);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.SUMMARY_TODAY)
  summaryToday() {
    return this.attendanceService.summaryToday();
  }

  @MessagePattern(ATTENDANCE_PATTERNS.MARK_ABSENT)
  markAbsent(@Payload() data: { userIds: number[]; date: string }) {
    return this.attendanceService.markAbsent(data.userIds, data.date);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.HEALTH)
  async health() {
    const dbOk = await this.oracleService.ping();
    return { status: dbOk ? 'ok' : 'degraded', service: 'attendance-service' };
  }
}
