import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Seed the Auth database (dexa_auth) with an HRD user and an EMPLOYEE user.
 * Passwords are always bcrypt-hashed; plaintext is never stored.
 *
 * IMPORTANT: The employee user id here must match the user_id used when
 * seeding the Employee Service (logical cross-service reference).
 */
async function main() {
  const url = process.env.AUTH_DATABASE_URL;
  const adapter = new PrismaMariaDb(url as string);
  const prisma = new PrismaClient({ adapter });

  const saltRounds = 10;

  const seedUsers = [
    { username: 'admin', password: 'password', role: 'HRD' as const },
    { username: 'employee', password: 'password', role: 'EMPLOYEE' as const },
  ];

  for (const u of seedUsers) {
    const hashed = await bcrypt.hash(u.password, saltRounds);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashed, role: u.role },
      create: { username: u.username, password: hashed, role: u.role },
    });
    console.log(`Seeded user: ${u.username} (${u.role})`);
  }

  await prisma.$disconnect();
  console.log('Auth seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
