import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RpcAllExceptionsFilter } from '@app/common';
import { EmployeeServiceModule } from './employee-service.module';

async function bootstrap() {
  const logger = new Logger('EmployeeService');

  const appContext = await NestFactory.createApplicationContext(
    EmployeeServiceModule,
  );
  const configService = appContext.get(ConfigService);
  const port = Number(
    configService.get<string>('EMPLOYEE_SERVICE_PORT', '3002'),
  );
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmployeeServiceModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcAllExceptionsFilter());

  await app.listen();
  logger.log(`Employee Service is listening on TCP port ${port}`);
}
bootstrap();
