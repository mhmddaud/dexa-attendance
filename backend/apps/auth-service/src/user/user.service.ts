import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@app/common';
import type {
  CreateUserDto,
  PaginatedResult,
  PaginationQueryDto,
  UpdateUserDto,
} from '@app/dto';
import { PrismaService } from '../prisma/prisma.service';

/** Public-safe user shape (never includes the password hash). */
export interface PublicUser {
  id: number;
  username: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PublicUser>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where = query.search
      ? { username: { contains: query.search } }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows.map((u) => this.toPublic(u)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.toPublic(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    await this.ensureUsernameUnique(dto.username);
    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        role: dto.role,
      },
    });
    this.logger.log(`User created id=${created.id} role=${created.role}`);
    return this.toPublic(created);
  }

  async update(id: number, dto: UpdateUserDto): Promise<PublicUser> {
    await this.findOne(id);
    if (dto.username) {
      await this.ensureUsernameUnique(dto.username, id);
    }

    const data: {
      username?: string;
      role?: Role;
      password?: string;
    } = {};
    if (dto.username) data.username = dto.username;
    if (dto.role) data.role = dto.role;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    this.logger.log(`User updated id=${id}`);
    return this.toPublic(updated);
  }

  async remove(id: number): Promise<{ id: number; deleted: boolean }> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted id=${id}`);
    return { id, deleted: true };
  }

  private async ensureUsernameUnique(
    username: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Username "${username}" is already in use`);
    }
  }

  private toPublic(user: {
    id: number;
    username: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
