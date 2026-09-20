import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 configuration for the Employee Service (dexa_employee / MySQL).
// schema/migrations paths are relative to this config file (apps/employee-service/);
// the seed command runs from the workspace root, so it uses the full path.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx apps/employee-service/prisma/seed.ts',
  },
  datasource: {
    url: process.env.EMPLOYEE_DATABASE_URL,
  },
});
