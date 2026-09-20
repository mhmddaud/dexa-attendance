-- Initialize both MySQL databases used by the backend when running via Docker.
-- Table creation is handled by Prisma migrations (run once against the
-- container), but we ensure both schemas exist up front.

CREATE DATABASE IF NOT EXISTS dexa_auth
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS dexa_employee
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
