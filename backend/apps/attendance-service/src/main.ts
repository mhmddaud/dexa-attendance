import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RpcAllExceptionsFilter } from '@app/common';
import { AttendanceServiceModule } from './attendance-service.module';

async function bootstrap() {
  const logger = new Logger('AttendanceService');

  const appContext = await NestFactory.createApplicationContext(
    AttendanceServiceModule,
  );
  const configService = appContext.get(ConfigService);
  const port = Number(
    configService.get<string>('ATTENDANCE_SERVICE_PORT', '3003'),
  );
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AttendanceServiceModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcAllExceptionsFilter());

  await app.listen();
  logger.log(`Attendance Service is listening on TCP port ${port}`);
}
bootstrap();
