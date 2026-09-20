import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AUTH_PATTERNS } from '@app/common';
import { LoginDto } from '@app/dto';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly rpc: RpcClientService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive a JWT access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid username or password' })
  login(@Body() dto: LoginDto) {
    return this.rpc.send('auth', AUTH_PATTERNS.LOGIN, dto);
  }
}
