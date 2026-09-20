import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ATTENDANCE_PATTERNS,
  AUTH_PATTERNS,
  EMPLOYEE_PATTERNS,
} from '@app/common';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly rpc: RpcClientService) {}

  @Get('health')
  async health() {
    const services = await Promise.allSettled([
      this.rpc.send('auth', AUTH_PATTERNS.HEALTH, {}),
      this.rpc.send('employee', EMPLOYEE_PATTERNS.HEALTH, {}),
      this.rpc.send('attendance', ATTENDANCE_PATTERNS.HEALTH, {}),
    ]);

    const [auth, employee, attendance] = services.map((s) =>
      s.status === 'fulfilled' ? 'ok' : 'down',
    );

    const allOk = auth === 'ok' && employee === 'ok' && attendance === 'ok';

    return {
      status: allOk ? 'ok' : 'degraded',
      services: { gateway: 'ok', auth, employee, attendance },
    };
  }
}
