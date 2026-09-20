import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Shared auth library module.
 *
 * Registers @nestjs/jwt (configured from env) and provides the reusable
 * JwtAuthGuard and RolesGuard. Import this module wherever the guards are
 * needed (primarily the API Gateway).
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // env-provided value (e.g. "1h"); typed loosely to satisfy @nestjs/jwt types
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '1h',
          ) as unknown as number,
        },
      }),
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthLibModule {}
