import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_CLIENT,
  ATTENDANCE_CLIENT,
  EMPLOYEE_CLIENT,
} from './client-tokens';
import { RpcClientService } from './rpc-client.service';

/**
 * Registers TCP clients for the three backend microservices and exposes a
 * shared RpcClientService that forwards messages and maps RPC errors to HTTP.
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get<string>('AUTH_SERVICE_PORT', '3001')),
          },
        }),
      },
      {
        name: EMPLOYEE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('EMPLOYEE_SERVICE_HOST', '127.0.0.1'),
            port: Number(config.get<string>('EMPLOYEE_SERVICE_PORT', '3002')),
          },
        }),
      },
      {
        name: ATTENDANCE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ATTENDANCE_SERVICE_HOST', '127.0.0.1'),
            port: Number(
              config.get<string>('ATTENDANCE_SERVICE_PORT', '3003'),
            ),
          },
        }),
      },
    ]),
  ],
  providers: [RpcClientService],
  exports: [RpcClientService, ClientsModule],
})
export class GatewayClientsModule {}
