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
  CreateDepartmentDto,
  PaginationQueryDto,
  UpdateDepartmentDto,
} from '@app/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/departments')
export class DepartmentController {
  constructor(private readonly rpc: RpcClientService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.DEPARTMENT_LIST, query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.DEPARTMENT_GET, { id });
  }

  @Get(':departmentId/positions')
  positionsByDepartment(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.rpc.send(
      'employee',
      EMPLOYEE_PATTERNS.POSITION_LIST_BY_DEPARTMENT,
      { departmentId },
    );
  }

  @Post()
  @Roles(Role.HRD)
  create(@Body() dto: CreateDepartmentDto) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.DEPARTMENT_CREATE, dto);
  }

  @Patch(':id')
  @Roles(Role.HRD)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.DEPARTMENT_UPDATE, {
      id,
      dto,
    });
  }

  @Delete(':id')
  @Roles(Role.HRD)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.DEPARTMENT_DELETE, {
      id,
    });
  }
}
