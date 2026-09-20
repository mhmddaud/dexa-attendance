import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 configuration for the Auth Service (dexa_auth / MySQL).
// Paths are resolved relative to this config file (apps/auth-service/).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx apps/auth-service/prisma/seed.ts',
  },
  datasource: {
    url: process.env.AUTH_DATABASE_URL,
  },
});
