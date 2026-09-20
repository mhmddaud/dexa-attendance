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
import { EMPLOYEE_PATTERNS, Role } from '@app/common';
import {
  CreateEmployeeDto,
  PaginationQueryDto,
  UpdateEmployeeDto,
} from '@app/dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@app/auth';
import type { AuthenticatedUser } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/employees')
export class EmployeeController {
  constructor(private readonly rpc: RpcClientService) {}

  /** Current employee's own profile (any authenticated user). */
  @Get('me')
  myProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_GET_BY_USER, {
      userId: user.sub,
    });
  }

  @Get()
  @Roles(Role.HRD)
  list(
    @Query()
    query: PaginationQueryDto & { departmentId?: number; positionId?: number },
  ) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_LIST, query);
  }

  @Get(':id')
  @Roles(Role.HRD)
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_GET, { id });
  }

  @Post()
  @Roles(Role.HRD)
  create(@Body() dto: CreateEmployeeDto) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_CREATE, dto);
  }

  @Patch(':id')
  @Roles(Role.HRD)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_UPDATE, {
      id,
      dto,
    });
  }

  @Delete(':id')
  @Roles(Role.HRD)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.EMPLOYEE_DELETE, { id });
  }
}
