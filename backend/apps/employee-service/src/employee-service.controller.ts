import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EMPLOYEE_PATTERNS } from '@app/common';
import type {
  CreateDepartmentDto,
  CreateEmployeeDto,
  CreatePositionDto,
  PaginationQueryDto,
  UpdateDepartmentDto,
  UpdateEmployeeDto,
  UpdatePositionDto,
} from '@app/dto';
import { DepartmentService } from './department/department.service';
import { PositionService } from './position/position.service';
import { EmployeeService } from './employee/employee.service';

@Controller()
export class EmployeeServiceController {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly positionService: PositionService,
    private readonly employeeService: EmployeeService,
  ) {}

  // ---------------- Departments ----------------
  @MessagePattern(EMPLOYEE_PATTERNS.DEPARTMENT_LIST)
  listDepartments(@Payload() query: PaginationQueryDto) {
    return this.departmentService.findAll(query);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.DEPARTMENT_GET)
  getDepartment(@Payload() data: { id: number }) {
    return this.departmentService.findOne(data.id);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.DEPARTMENT_CREATE)
  createDepartment(@Payload() dto: CreateDepartmentDto) {
    return this.departmentService.create(dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.DEPARTMENT_UPDATE)
  updateDepartment(
    @Payload() data: { id: number; dto: UpdateDepartmentDto },
  ) {
    return this.departmentService.update(data.id, data.dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.DEPARTMENT_DELETE)
  deleteDepartment(@Payload() data: { id: number }) {
    return this.departmentService.remove(data.id);
  }

  // ---------------- Positions ----------------
  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_LIST)
  listPositions(
    @Payload() query: PaginationQueryDto & { departmentId?: number },
  ) {
    return this.positionService.findAll(query);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_GET)
  getPosition(@Payload() data: { id: number }) {
    return this.positionService.findOne(data.id);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_LIST_BY_DEPARTMENT)
  listPositionsByDepartment(@Payload() data: { departmentId: number }) {
    return this.positionService.findByDepartment(data.departmentId);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_CREATE)
  createPosition(@Payload() dto: CreatePositionDto) {
    return this.positionService.create(dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_UPDATE)
  updatePosition(@Payload() data: { id: number; dto: UpdatePositionDto }) {
    return this.positionService.update(data.id, data.dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.POSITION_DELETE)
  deletePosition(@Payload() data: { id: number }) {
    return this.positionService.remove(data.id);
  }

  // ---------------- Employees ----------------
  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_LIST)
  listEmployees(
    @Payload()
    query: PaginationQueryDto & {
      departmentId?: number;
      positionId?: number;
    },
  ) {
    return this.employeeService.findAll(query);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_GET)
  getEmployee(@Payload() data: { id: number }) {
    return this.employeeService.findOne(data.id);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_GET_BY_USER)
  getEmployeeByUser(@Payload() data: { userId: number }) {
    return this.employeeService.findByUserId(data.userId);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_CREATE)
  createEmployee(@Payload() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_UPDATE)
  updateEmployee(@Payload() data: { id: number; dto: UpdateEmployeeDto }) {
    return this.employeeService.update(data.id, data.dto);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_DELETE)
  deleteEmployee(@Payload() data: { id: number }) {
    return this.employeeService.remove(data.id);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_COUNT)
  countEmployees() {
    return this.employeeService.count();
  }

  @MessagePattern(EMPLOYEE_PATTERNS.EMPLOYEE_USER_IDS)
  employeeUserIds() {
    return this.employeeService.listUserIds();
  }

  @MessagePattern(EMPLOYEE_PATTERNS.HEALTH)
  health() {
    return { status: 'ok', service: 'employee-service' };
  }
}
