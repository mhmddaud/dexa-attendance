import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateDepartmentDto,
  PaginatedResult,
  PaginationQueryDto,
  UpdateDepartmentDto,
} from '@app/dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { code: { contains: query.search } },
            { name: { contains: query.search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { positions: true },
    });
    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    await this.ensureUnique(dto.code, dto.name);
    const created = await this.prisma.department.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
    this.logger.log(`Department created id=${created.id}`);
    return created;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    if (dto.code || dto.name) {
      await this.ensureUnique(dto.code, dto.name, id);
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });
    this.logger.log(`Department updated id=${id}`);
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    const [positionCount, employeeCount] = await Promise.all([
      this.prisma.position.count({ where: { departmentId: id } }),
      this.prisma.employee.count({ where: { departmentId: id } }),
    ]);

    if (positionCount > 0 || employeeCount > 0) {
      throw new ConflictException(
        'Department is still used by positions or employees and cannot be deleted',
      );
    }

    await this.prisma.department.delete({ where: { id } });
    this.logger.log(`Department deleted id=${id}`);
    return { id, deleted: true };
  }

  private async ensureUnique(
    code?: string,
    name?: string,
    excludeId?: number,
  ): Promise<void> {
    if (code) {
      const byCode = await this.prisma.department.findUnique({
        where: { code },
      });
      if (byCode && byCode.id !== excludeId) {
        throw new ConflictException(
          `Department code "${code}" is already in use`,
        );
      }
    }
    if (name) {
      const byName = await this.prisma.department.findUnique({
        where: { name },
      });
      if (byName && byName.id !== excludeId) {
        throw new ConflictException(
          `Department name "${name}" is already in use`,
        );
      }
    }
  }
}
