import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolveEnvFilePaths } from '@app/common';
import { EmployeeServiceController } from './employee-service.controller';
import { PrismaModule } from './prisma/prisma.module';
import { DepartmentService } from './department/department.service';
import { PositionService } from './position/position.service';
import { EmployeeService } from './employee/employee.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolveEnvFilePaths() }),
    PrismaModule,
  ],
  controllers: [EmployeeServiceController],
  providers: [DepartmentService, PositionService, EmployeeService],
})
export class EmployeeServiceModule {}
