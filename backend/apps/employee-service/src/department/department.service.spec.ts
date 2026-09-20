import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentService } from './department.service';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let prisma: {
    department: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    position: { count: jest.Mock };
    employee: { count: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      department: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 1, ...data })),
        update: jest.fn().mockImplementation(({ data }) => ({ id: 1, ...data })),
        delete: jest.fn().mockResolvedValue({}),
      },
      position: { count: jest.fn().mockResolvedValue(0) },
      employee: { count: jest.fn().mockResolvedValue(0) },
    };
    service = new DepartmentService(prisma as never);
  });

  it('creates a department when code and name are unique', async () => {
    const result = await service.create({ code: 'IT', name: 'Information Tech' });
    expect(result.id).toBe(1);
  });

  it('rejects creating a department with a duplicate code', async () => {
    prisma.department.findUnique.mockResolvedValueOnce({ id: 5 }); // code check
    await expect(
      service.create({ code: 'IT', name: 'Information Tech' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFound when deleting a missing department', async () => {
    prisma.department.findUnique.mockResolvedValue(null);
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects deleting a department still used by positions', async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1, positions: [] });
    prisma.position.count.mockResolvedValue(2);
    prisma.employee.count.mockResolvedValue(0);

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused department', async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1, positions: [] });
    prisma.position.count.mockResolvedValue(0);
    prisma.employee.count.mockResolvedValue(0);

    const result = await service.remove(1);
    expect(result).toEqual({ id: 1, deleted: true });
  });
});
