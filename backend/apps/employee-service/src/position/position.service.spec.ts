import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PositionService } from './position.service';

describe('PositionService', () => {
  let service: PositionService;
  let prisma: {
    position: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    department: { findUnique: jest.Mock };
    employee: { count: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      position: {
        findMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 1, ...data })),
        delete: jest.fn().mockResolvedValue({}),
      },
      department: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
      employee: { count: jest.fn().mockResolvedValue(0) },
    };
    service = new PositionService(prisma as never);
  });

  it('creates a position under an existing department', async () => {
    const result = await service.create({
      departmentId: 1,
      code: 'SSE',
      name: 'Senior Software Engineer',
    });
    expect(result.id).toBe(1);
  });

  it('rejects create when the department does not exist', async () => {
    prisma.department.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ departmentId: 99, code: 'X', name: 'Y' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects create with a duplicate code', async () => {
    prisma.position.findUnique.mockResolvedValue({ id: 5 });
    await expect(
      service.create({ departmentId: 1, code: 'SSE', name: 'Dup' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects deleting a position still used by employees', async () => {
    prisma.position.findUnique.mockResolvedValue({
      id: 1,
      departmentId: 1,
      department: { id: 1, code: 'IT', name: 'IT' },
    });
    prisma.employee.count.mockResolvedValue(3);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.position.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused position', async () => {
    prisma.position.findUnique.mockResolvedValue({
      id: 1,
      departmentId: 1,
      department: { id: 1, code: 'IT', name: 'IT' },
    });
    prisma.employee.count.mockResolvedValue(0);

    const result = await service.remove(1);
    expect(result).toEqual({ id: 1, deleted: true });
  });
});
