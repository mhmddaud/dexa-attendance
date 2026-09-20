import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RpcAllExceptionsFilter } from '@app/common';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const logger = new Logger('AuthService');

  const appContext =
    await NestFactory.createApplicationContext(AuthServiceModule);
  const configService = appContext.get(ConfigService);
  const port = Number(configService.get<string>('AUTH_SERVICE_PORT', '3001'));
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: { host: '0.0.0.0', port },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new RpcAllExceptionsFilter());

  await app.listen();
  logger.log(`Auth Service is listening on TCP port ${port}`);
}
bootstrap();
