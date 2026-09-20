import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateEmployeeDto,
  PaginatedResult,
  PaginationQueryDto,
  UpdateEmployeeDto,
} from '@app/dto';
import { PrismaService } from '../prisma/prisma.service';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, code: true, name: true } },
  position: { select: { id: true, code: true, name: true } },
} as const;

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: PaginationQueryDto & {
      departmentId?: number;
      positionId?: number;
    },
  ): Promise<PaginatedResult<unknown>> {
    // Query values arrive over TCP as plain (possibly string) values; coerce.
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }
    if (query.positionId) {
      where.positionId = Number(query.positionId);
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { employeeNo: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: EMPLOYEE_INCLUDE,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: data.map((e) => this.serialize(e)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return this.serialize(employee);
  }

  async findByUserId(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee profile for user ${userId} not found`,
      );
    }
    return this.serialize(employee);
  }

  /**
   * Convert Prisma Decimal fields (latitude/longitude) to plain numbers so the
   * record serializes cleanly over TCP/JSON.
   */
  private serialize<T extends { latitude?: unknown; longitude?: unknown }>(
    employee: T,
  ): T & { latitude: number | null; longitude: number | null } {
    return {
      ...employee,
      latitude: this.toCoordNumber(employee.latitude),
      longitude: this.toCoordNumber(employee.longitude),
    };
  }

  /** Normalize an incoming coordinate (number) to the stored string form. */
  private toCoordString(value: number | null | undefined): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  /** Parse a stored coordinate (string in VARCHAR) back to a number. */
  private toCoordNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async count(): Promise<number> {
    return this.prisma.employee.count();
  }

  /** All employee userIds (logical references to Auth Service users). */
  async listUserIds(): Promise<number[]> {
    const rows = await this.prisma.employee.findMany({
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async create(dto: CreateEmployeeDto) {
    await this.validateDepartmentPositionConsistency(
      dto.departmentId,
      dto.positionId,
    );
    await this.ensureUniqueFields(dto.userId, dto.employeeNo, dto.email);

    const created = await this.prisma.employee.create({
      data: {
        userId: dto.userId,
        employeeNo: dto.employeeNo,
        name: dto.name,
        email: dto.email,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        latitude: this.toCoordString(dto.latitude),
        longitude: this.toCoordString(dto.longitude),
      },
      include: EMPLOYEE_INCLUDE,
    });
    this.logger.log(`Employee created id=${created.id}`);
    return this.serialize(created);
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const existing = await this.findOne(id);

    const departmentId = dto.departmentId ?? existing.departmentId;
    const positionId = dto.positionId ?? existing.positionId;

    // Re-validate consistency whenever either side changes.
    if (dto.departmentId !== undefined || dto.positionId !== undefined) {
      await this.validateDepartmentPositionConsistency(departmentId, positionId);
    }

    await this.ensureUniqueFields(
      dto.userId,
      dto.employeeNo,
      dto.email,
      id,
    );

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        userId: dto.userId,
        employeeNo: dto.employeeNo,
        name: dto.name,
        email: dto.email,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        latitude:
          dto.latitude === undefined
            ? undefined
            : this.toCoordString(dto.latitude),
        longitude:
          dto.longitude === undefined
            ? undefined
            : this.toCoordString(dto.longitude),
      },
      include: EMPLOYEE_INCLUDE,
    });
    this.logger.log(`Employee updated id=${id}`);
    return this.serialize(updated);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.employee.delete({ where: { id } });
    this.logger.log(`Employee deleted id=${id}`);
    return { id, deleted: true };
  }

  /**
   * Enforce that the chosen position actually belongs to the chosen department.
   * This is the core business rule keeping employees.department_id consistent
   * with positions.department_id.
   */
  private async validateDepartmentPositionConsistency(
    departmentId: number,
    positionId: number,
  ): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new BadRequestException(
        `Department with id ${departmentId} does not exist`,
      );
    }

    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
    });
    if (!position) {
      throw new BadRequestException(
        `Position with id ${positionId} does not exist`,
      );
    }

    if (position.departmentId !== departmentId) {
      throw new BadRequestException(
        `Position ${positionId} does not belong to department ${departmentId}`,
      );
    }
  }

  private async ensureUniqueFields(
    userId?: number,
    employeeNo?: string,
    email?: string,
    excludeId?: number,
  ): Promise<void> {
    if (userId !== undefined) {
      const byUser = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (byUser && byUser.id !== excludeId) {
        throw new ConflictException(
          `An employee already exists for user id ${userId}`,
        );
      }
    }
    if (employeeNo !== undefined) {
      const byNo = await this.prisma.employee.findUnique({
        where: { employeeNo },
      });
      if (byNo && byNo.id !== excludeId) {
        throw new ConflictException(
          `Employee number "${employeeNo}" is already in use`,
        );
      }
    }
    if (email !== undefined) {
      const byEmail = await this.prisma.employee.findUnique({
        where: { email },
      });
      if (byEmail && byEmail.id !== excludeId) {
        throw new ConflictException(`Email "${email}" is already in use`);
      }
    }
  }
}
