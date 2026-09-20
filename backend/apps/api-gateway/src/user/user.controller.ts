import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AUTH_PATTERNS, Role } from '@app/common';
import { CreateUserDto, PaginationQueryDto, UpdateUserDto } from '@app/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HRD)
@Controller('api/users')
export class UserController {
  constructor(private readonly rpc: RpcClientService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.rpc.send('auth', AUTH_PATTERNS.USER_LIST, query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('auth', AUTH_PATTERNS.USER_GET, { id });
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.rpc.send('auth', AUTH_PATTERNS.USER_CREATE, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.rpc.send('auth', AUTH_PATTERNS.USER_UPDATE, { id, dto });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('auth', AUTH_PATTERNS.USER_DELETE, { id });
  }
}
