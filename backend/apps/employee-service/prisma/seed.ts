import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Seed the Employee database (dexa_employee) with sample departments,
 * positions and employees.
 *
 * NOTE: employee.userId values are logical references to Auth Service users.
 * The seeded EMPLOYEE user in dexa_auth has id = 2, so we attach one employee
 * profile to userId = 2 (and the HRD user id = 1 as a second employee record).
 */
async function main() {
  const url = process.env.EMPLOYEE_DATABASE_URL;
  const adapter = new PrismaMariaDb(url as string);
  const prisma = new PrismaClient({ adapter });

  // Departments
  const it = await prisma.department.upsert({
    where: { code: 'IT' },
    update: { name: 'Information Technology' },
    create: {
      code: 'IT',
      name: 'Information Technology',
      description: 'Handles software, infrastructure and IT operations',
    },
  });

  const hr = await prisma.department.upsert({
    where: { code: 'HR' },
    update: { name: 'Human Resources' },
    create: {
      code: 'HR',
      name: 'Human Resources',
      description: 'People operations and recruitment',
    },
  });

  // Positions
  const sse = await prisma.position.upsert({
    where: { code: 'IT-SSE' },
    update: { name: 'Senior Software Engineer', departmentId: it.id },
    create: {
      code: 'IT-SSE',
      name: 'Senior Software Engineer',
      departmentId: it.id,
      description: 'Leads development efforts',
    },
  });

  await prisma.position.upsert({
    where: { code: 'IT-SE' },
    update: { name: 'Software Engineer', departmentId: it.id },
    create: {
      code: 'IT-SE',
      name: 'Software Engineer',
      departmentId: it.id,
    },
  });

  const hrManager = await prisma.position.upsert({
    where: { code: 'HR-MGR' },
    update: { name: 'HR Manager', departmentId: hr.id },
    create: {
      code: 'HR-MGR',
      name: 'HR Manager',
      departmentId: hr.id,
      description: 'Manages HR department',
    },
  });

  // Employees (userId references dexa_auth users: 1=admin/HRD, 2=employee/EMPLOYEE)
  await prisma.employee.upsert({
    where: { userId: 2 },
    update: {},
    create: {
      userId: 2,
      employeeNo: 'EMP-0001',
      name: 'Employee One',
      email: 'employee.one@dexa.com',
      departmentId: it.id,
      positionId: sse.id,
    },
  });

  await prisma.employee.upsert({
    where: { userId: 1 },
    update: {},
    create: {
      userId: 1,
      employeeNo: 'EMP-0002',
      name: 'HRD Admin',
      email: 'hrd.admin@dexa.com',
      departmentId: hr.id,
      positionId: hrManager.id,
    },
  });

  await prisma.$disconnect();
  console.log('Employee seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
