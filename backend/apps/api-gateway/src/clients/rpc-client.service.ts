import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { isRpcErrorShape, rpcErrorToHttpException } from '@app/common';
import {
  AUTH_CLIENT,
  ATTENDANCE_CLIENT,
  EMPLOYEE_CLIENT,
} from './client-tokens';

type ServiceKey = 'auth' | 'employee' | 'attendance';

/**
 * Thin wrapper over the three TCP ClientProxy instances.
 *
 * `send` forwards a message pattern + payload to the target service, awaits the
 * response, and translates any serialized RPC error back into the correct HTTP
 * exception so the gateway responds with the proper status code.
 */
@Injectable()
export class RpcClientService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(EMPLOYEE_CLIENT) private readonly employeeClient: ClientProxy,
    @Inject(ATTENDANCE_CLIENT) private readonly attendanceClient: ClientProxy,
  ) {}

  private clientFor(service: ServiceKey): ClientProxy {
    switch (service) {
      case 'auth':
        return this.authClient;
      case 'employee':
        return this.employeeClient;
      case 'attendance':
        return this.attendanceClient;
    }
  }

  async send<TResult = unknown>(
    service: ServiceKey,
    pattern: string,
    payload: unknown,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.clientFor(service).send<TResult>(pattern, payload ?? {}),
      );
    } catch (error) {
      if (isRpcErrorShape(error)) {
        throw rpcErrorToHttpException(error);
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Upstream service error',
      );
    }
  }
}
