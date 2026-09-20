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
  CreatePositionDto,
  PaginationQueryDto,
  UpdatePositionDto,
} from '@app/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@app/auth';
import { RpcClientService } from '../clients/rpc-client.service';

@ApiTags('Positions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/positions')
export class PositionController {
  constructor(private readonly rpc: RpcClientService) {}

  @Get()
  list(
    @Query() query: PaginationQueryDto & { departmentId?: number },
  ) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.POSITION_LIST, query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.POSITION_GET, { id });
  }

  @Post()
  @Roles(Role.HRD)
  create(@Body() dto: CreatePositionDto) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.POSITION_CREATE, dto);
  }

  @Patch(':id')
  @Roles(Role.HRD)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.POSITION_UPDATE, {
      id,
      dto,
    });
  }

  @Delete(':id')
  @Roles(Role.HRD)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rpc.send('employee', EMPLOYEE_PATTERNS.POSITION_DELETE, { id });
  }
}
