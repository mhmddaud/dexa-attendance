import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ATTENDANCE_PATTERNS,
  EMPLOYEE_PATTERNS,
  Role,
} from '@app/common';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly rpc: RpcClientService) {}

  /** HRD dashboard summary: employee count + today's attendance counts. */
  @Get('summary')
  @Roles(Role.HRD)
  async summary() {
    const [totalEmployees, attendance] = await Promise.all([
      this.rpc.send<number>('employee', EMPLOYEE_PATTERNS.EMPLOYEE_COUNT, {}),
      this.rpc.send<{
        date: string;
        total: number;
        checkedIn: number;
        checkedOut: number;
      }>('attendance', ATTENDANCE_PATTERNS.SUMMARY_TODAY, {}),
    ]);

    return {
      totalEmployees,
      today: attendance,
      absent: Math.max(totalEmployees - attendance.checkedIn, 0),
    };
  }
}
