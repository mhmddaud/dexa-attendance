# ---- Multi-stage build for the NestJS monorepo (one image per app) ----
# Build once, run a specific app selected via the APP build arg.

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# System deps for native modules (bcrypt build) + Prisma engines (openssl).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install all deps (native modules build here).
RUN npm ci

COPY . .

# Generate Prisma clients for both MySQL-backed services, then build all apps.
RUN npx prisma generate --config apps/auth-service/prisma.config.ts \
  && npx prisma generate --config apps/employee-service/prisma.config.ts \
  && npx nest build api-gateway \
  && npx nest build auth-service \
  && npx nest build employee-service \
  && npx nest build attendance-service

# ---- Runtime image ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# openssl for Prisma; libaio1 is needed by the Oracle thick client but the
# oracledb thin mode used here does not require it. Keep openssl only.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and Prisma artifacts.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps ./apps

# Which app to run (api-gateway | auth-service | employee-service | attendance-service).
ARG APP=api-gateway
ENV APP=${APP}

# Uploads directory for attendance photos (mounted as a volume in compose).
RUN mkdir -p uploads/attendance

CMD ["sh", "-c", "node dist/apps/${APP}/main.js"]
