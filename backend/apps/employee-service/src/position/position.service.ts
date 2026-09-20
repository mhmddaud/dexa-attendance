import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreatePositionDto,
  PaginatedResult,
  PaginationQueryDto,
  UpdatePositionDto,
} from '@app/dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: PaginationQueryDto & { departmentId?: number },
  ): Promise<PaginatedResult<unknown>> {
    // Query values arrive over TCP as plain (possibly string) values; coerce.
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.departmentId) {
      where.departmentId = Number(query.departmentId);
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          department: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByDepartment(departmentId: number) {
    await this.ensureDepartmentExists(departmentId);
    return this.prisma.position.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
    });
    if (!position) {
      throw new NotFoundException(`Position with id ${id} not found`);
    }
    return position;
  }

  async create(dto: CreatePositionDto) {
    await this.ensureDepartmentExists(dto.departmentId);
    await this.ensureCodeUnique(dto.code);
    await this.ensureNameUniqueInDepartment(dto.departmentId, dto.name);

    const created = await this.prisma.position.create({
      data: {
        departmentId: dto.departmentId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
    });
    this.logger.log(`Position created id=${created.id}`);
    return created;
  }

  async update(id: number, dto: UpdatePositionDto) {
    const existing = await this.findOne(id);
    const departmentId = dto.departmentId ?? existing.departmentId;

    if (dto.departmentId) {
      await this.ensureDepartmentExists(dto.departmentId);
    }
    if (dto.code) {
      await this.ensureCodeUnique(dto.code, id);
    }
    if (dto.name || dto.departmentId) {
      await this.ensureNameUniqueInDepartment(
        departmentId,
        dto.name ?? existing.name,
        id,
      );
    }

    const updated = await this.prisma.position.update({
      where: { id },
      data: {
        departmentId: dto.departmentId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
    });
    this.logger.log(`Position updated id=${id}`);
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({
      where: { positionId: id },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        'Position is still used by employees and cannot be deleted',
      );
    }

    await this.prisma.position.delete({ where: { id } });
    this.logger.log(`Position deleted id=${id}`);
    return { id, deleted: true };
  }

  private async ensureDepartmentExists(departmentId: number): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new BadRequestException(
        `Department with id ${departmentId} does not exist`,
      );
    }
  }

  private async ensureCodeUnique(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const byCode = await this.prisma.position.findUnique({ where: { code } });
    if (byCode && byCode.id !== excludeId) {
      throw new ConflictException(`Position code "${code}" is already in use`);
    }
  }

  private async ensureNameUniqueInDepartment(
    departmentId: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.position.findFirst({
      where: { departmentId, name },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Position name "${name}" already exists in this department`,
      );
    }
  }
}
