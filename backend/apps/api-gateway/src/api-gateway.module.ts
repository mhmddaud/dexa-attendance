import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthLibModule } from '@app/auth';
import { resolveEnvFilePaths } from '@app/common';
import { GatewayClientsModule } from './clients/clients.module';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { DepartmentController } from './employee/department.controller';
import { PositionController } from './employee/position.controller';
import { EmployeeController } from './employee/employee.controller';
import { AttendanceController } from './attendance/attendance.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolveEnvFilePaths() }),
    AuthLibModule,
    GatewayClientsModule,
  ],
  controllers: [
    AuthController,
    UserController,
    DepartmentController,
    PositionController,
    EmployeeController,
    AttendanceController,
    DashboardController,
    HealthController,
  ],
})
export class ApiGatewayModule {}
