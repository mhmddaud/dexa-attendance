import { BadRequestException, ConflictException } from '@nestjs/common';
import { EmployeeService } from './employee.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: {
    employee: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    department: { findUnique: jest.Mock };
    position: { findUnique: jest.Mock };
  };

  const baseDto = {
    userId: 5,
    employeeNo: 'EMP-100',
    name: 'Jane',
    email: 'jane@dexa.com',
    departmentId: 1,
    positionId: 10,
  };

  beforeEach(() => {
    prisma = {
      employee: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 1, ...data })),
        update: jest.fn().mockImplementation(({ data }) => ({ id: 1, ...data })),
        delete: jest.fn().mockResolvedValue({}),
      },
      department: { findUnique: jest.fn() },
      position: { findUnique: jest.fn() },
    };
    service = new EmployeeService(prisma as never);
  });

  it('creates an employee when department and position are consistent', async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.position.findUnique.mockResolvedValue({ id: 10, departmentId: 1 });

    const result = await service.create(baseDto);
    expect(result.id).toBe(1);
    expect(prisma.employee.create).toHaveBeenCalled();
  });

  it('rejects create when the position belongs to a different department', async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.position.findUnique.mockResolvedValue({ id: 10, departmentId: 2 });

    await expect(service.create(baseDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.employee.create).not.toHaveBeenCalled();
  });

  it('rejects create when the department does not exist', async () => {
    prisma.department.findUnique.mockResolvedValue(null);

    await expect(service.create(baseDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects create when the employeeNo is already used', async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.position.findUnique.mockResolvedValue({ id: 10, departmentId: 1 });
    // userId unique check passes, employeeNo check returns an existing record
    prisma.employee.findUnique
      .mockResolvedValueOnce(null) // userId
      .mockResolvedValueOnce({ id: 99 }); // employeeNo

    await expect(service.create(baseDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates an employee and re-validates consistency', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 1,
      departmentId: 1,
      positionId: 10,
    });
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.position.findUnique.mockResolvedValue({ id: 11, departmentId: 1 });

    const result = await service.update(1, { positionId: 11 });
    expect(result.id).toBe(1);
    expect(prisma.employee.update).toHaveBeenCalled();
  });

  it('deletes an employee that exists', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 1 });
    const result = await service.remove(1);
    expect(result).toEqual({ id: 1, deleted: true });
    expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
