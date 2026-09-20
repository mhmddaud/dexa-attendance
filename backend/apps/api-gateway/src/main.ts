import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { ApiGatewayModule } from './api-gateway.module';
import { TransformInterceptor } from './common/transform.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create<NestExpressApplication>(
    ApiGatewayModule,
  );
  const config = app.get(ConfigService);

  // Validation runs here (the HTTP entrypoint) with the real DTO classes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Wrap every success response in a uniform envelope, and render every error
  // in the matching shape.
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS for the frontend.
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  // Serve uploaded attendance photos statically at /uploads.
  const uploadDir = config.get<string>('UPLOAD_DIR', 'uploads');
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads/' });

  // Swagger / OpenAPI docs at /api.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dexa Attendance API')
    .setDescription(
      'API Gateway for the Dexa employee attendance system (auth, employees, departments, positions, attendance).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = Number(config.get<string>('API_GATEWAY_PORT', '3000'));
  await app.listen(port);
  logger.log(`API Gateway is running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api`);
}
bootstrap();
