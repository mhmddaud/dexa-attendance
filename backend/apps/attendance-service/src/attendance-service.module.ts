import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolveEnvFilePaths } from '@app/common';
import { AttendanceServiceController } from './attendance-service.controller';
import { OracleModule } from './oracle/oracle.module';
import { AttendanceService } from './attendance/attendance.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: resolveEnvFilePaths() }),
    OracleModule,
  ],
  controllers: [AttendanceServiceController],
  providers: [AttendanceService],
})
export class AttendanceServiceModule {}
