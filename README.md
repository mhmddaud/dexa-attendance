# Dexa Attendance System

A fullstack employee attendance application built with a **NestJS microservices** backend and a **React + Vite + Tailwind** frontend.

Employees check in and out with a **photo (camera)** and **GPS location**, and the system enforces a **500 m geofence** around each employee's registered work location. HRD manages **users, employees, departments, positions**, reviews all attendance on a **map**, and can **mark absentees**.

---

## Architecture

```
                React + Vite (Tailwind CSS)
                        Port 5173
                            |
                            | HTTP REST (JWT)
                            v
                   +------------------+
                   |   API Gateway    |   Port 3000  (no database)
                   +--------+---------+
                            |
                 NestJS TCP Transport
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   Auth Service       Employee Service    Attendance Service
      :3001               :3002                :3003
        |                   |                   |
        v                   v                   v
      MySQL               MySQL               Oracle
   dexa_auth          dexa_employee   FREEPDB1 / DEXA_ATTENDANCE
```

- **API Gateway** — the only HTTP entrypoint. Handles JWT auth, role authorization, DTO validation, request routing over TCP, error mapping, file uploads, cross-service orchestration (e.g. the attendance geofence), Swagger, and health checks. No database.
- **Auth Service** — login, bcrypt password verification, JWT issuance, and **user account CRUD**. Owns `dexa_auth` (MySQL, Prisma).
- **Employee Service** — CRUD for departments, positions, and employees (including department↔position consistency validation and per-employee location). Owns `dexa_employee` (MySQL, Prisma).
- **Attendance Service** — check-in / check-out business rules, photo path + GPS + notes storage, status calculation, and marking absentees. Owns the `ATTENDANCE` table (Oracle, `oracledb` with a connection pool and bind parameters).

Each service owns exactly one database. `user_id` in Employee and Attendance is a **logical reference** to the Auth Service user — there are no cross-database foreign keys. Data that spans domains (e.g. checking an employee's location during attendance) is orchestrated by the API Gateway.

---

## Tech Stack

**Backend:** NestJS (monorepo), TypeScript, NestJS Microservices (TCP), REST, JWT, RBAC, class-validator/transformer, `@nestjs/config`, Swagger, bcrypt, Prisma ORM 7 (MySQL, driver adapter), `oracledb` (Oracle), Jest.

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, JWT auth, Browser Geolocation API, Browser Camera / Media Capture API, Leaflet + OpenStreetMap (maps & geocoding search).

---

## Key Features

- **Authentication & RBAC** — JWT login, two roles: `EMPLOYEE` and `HRD`.
- **User management (HRD)** — create/update/delete login accounts; passwords are bcrypt-hashed and never returned.
- **Master data (HRD)** — departments and positions with a dependent department → position relationship; deletions are blocked while still referenced.
- **Employees (HRD)** — full CRUD. Each employee is linked to a user account (searchable by username), a department + position (consistency enforced), and a **required work location** picked on a map (address search, click, or "use my location").
- **Attendance (EMPLOYEE)** — check-in / check-out with camera photo + GPS + optional note. One record per day; the server generates the timestamp; a **500 m geofence** blocks attendance taken too far from the employee's registered location.
- **Attendance review (HRD)** — filter by department / date range / status, and open a detail view with **maps** showing the check-in and check-out locations plus photos. HRD can **mark absentees** for a date.

### Attendance status

Status is decided by the server:

| Condition | Status |
| --------- | ------ |
| Check-in **before** `ATTENDANCE_LATE_HOUR` | `PRESENT` |
| Check-in **at/after** `ATTENDANCE_LATE_HOUR` | `LATE` |
| No check-in and marked by HRD | `ABSENT` |

The late threshold hour is configurable via `ATTENDANCE_LATE_HOUR` (default `8` = 08:00).

---

## Prerequisites

- Node.js 20+ (developed on v24)
- MySQL 8 (e.g. via XAMPP) running on `localhost:3306`
- Oracle Free (FREEPDB1) running locally with a schema user (default `DEXA_ATTENDANCE`) that has `CONNECT`, `RESOURCE`, and a table quota
- (Optional) Docker + Docker Compose
- Internet access for the map tiles + address search (OpenStreetMap / Nominatim)

> **Windows / PowerShell note:** `npm` in PowerShell runs `npm.ps1`, which can be blocked by the execution policy (`Restricted`). If you hit "running scripts is disabled", either use `npm.cmd` / `npx.cmd`, or allow scripts once with
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. If your policy is already `RemoteSigned`/`Unrestricted`, plain `npm` works fine. The commands below use `npm.cmd` to be safe on a default Windows setup.

---

## Configuration

Backend environment lives in `backend/.env` (see `backend/.env.example`):

```
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
EMPLOYEE_SERVICE_PORT=3002
ATTENDANCE_SERVICE_PORT=3003

AUTH_SERVICE_HOST=127.0.0.1
EMPLOYEE_SERVICE_HOST=127.0.0.1
ATTENDANCE_SERVICE_HOST=127.0.0.1

JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1h

AUTH_DATABASE_URL="mysql://root@localhost:3306/dexa_auth"
EMPLOYEE_DATABASE_URL="mysql://root@localhost:3306/dexa_employee"

ORACLE_USER=DEXA_ATTENDANCE
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1

# Hour (0-23, server time) at/after which a check-in is marked LATE
ATTENDANCE_LATE_HOUR=8

UPLOAD_DIR=uploads
CORS_ORIGIN=http://localhost:5173
```

Frontend environment lives in `frontend/.env` (see `frontend/.env.example`):

```
VITE_API_URL=http://localhost:3000
```

> `.env` files are git-ignored. Never commit real credentials.

### Oracle user (one-time setup)

The Attendance Service creates the `ATTENDANCE` table automatically on first boot, but the schema user must exist first. As an admin (e.g. `SYSTEM`) connected to `FREEPDB1`:

```sql
CREATE USER DEXA_ATTENDANCE IDENTIFIED BY your_oracle_password;
GRANT CONNECT, RESOURCE TO DEXA_ATTENDANCE;
ALTER USER DEXA_ATTENDANCE QUOTA UNLIMITED ON USERS;
```

---

## Running without Docker

### 1. Backend

```powershell
cd backend
npm.cmd install

# Generate Prisma clients (MySQL services)
npm.cmd run prisma:generate

# Create schemas + apply migrations
npm.cmd run prisma:auth:deploy
npm.cmd run prisma:employee:deploy

# Seed demo data (bcrypt-hashed users, departments, positions, employees)
npm.cmd run prisma:auth:seed
npm.cmd run prisma:employee:seed

# Build all apps
npm.cmd run build
```

The Attendance Service creates / migrates its Oracle `ATTENDANCE` table automatically on first boot (idempotent DDL).

Start each service (separate terminals):

```powershell
npm.cmd run start:auth
npm.cmd run start:employee
npm.cmd run start:attendance
npm.cmd run start:gateway
```

### 2. Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5173.

---

## Running with Docker

MySQL and all backend services + the frontend run in containers. **Oracle stays on the host** and is reached via `host.docker.internal`.

```bash
# from the project root
docker compose up --build
```

Then run the Prisma migrations + seed against the containerized MySQL once
(host MySQL client or a one-off container), pointing at `localhost:3307`
(the mapped MySQL port). Oracle must be running on the host.

- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Swagger: http://localhost:3000/api

---

## API Documentation (Swagger)

With the gateway running, open **http://localhost:3000/api**. All endpoints are documented, with Bearer authentication (`Authorize` button).

Key endpoints:

| Method | Path | Role | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/auth/login` | public | Login, returns `{ accessToken, user }` |
| GET/POST/PATCH/DELETE | `/api/users` | HRD | User account CRUD |
| GET | `/api/employees/me` | any | Current employee profile |
| GET/POST/PATCH/DELETE | `/api/employees` | HRD | Employee CRUD (incl. location) |
| GET/POST/PATCH/DELETE | `/api/departments` | read: any / write: HRD | Department CRUD |
| GET | `/api/departments/:id/positions` | any | Positions in a department |
| GET/POST/PATCH/DELETE | `/api/positions` | read: any / write: HRD | Position CRUD |
| POST | `/api/attendance/check-in` | EMPLOYEE | Multipart (photo, latitude, longitude, note) |
| POST | `/api/attendance/check-out` | EMPLOYEE | Multipart (photo, latitude, longitude, note) |
| GET | `/api/attendance/me` | any | Own attendance (optional date range) |
| GET | `/api/attendance` | HRD | All attendance (filters: department, date, status) |
| GET | `/api/attendance/:id` | HRD | Single attendance record |
| POST | `/api/attendance/mark-absent` | HRD | Mark employees without a record as ABSENT for a date |
| GET | `/api/dashboard/summary` | HRD | Dashboard counts |
| GET | `/health` | public | Gateway + services health |

---

## Frontend Pages

- **/login** — role-based redirect after login.
- **Employee:** `/employee/dashboard`, `/employee/profile`, `/employee/attendance` (camera + GPS check-in/out), `/employee/history`.
- **HRD:** `/hrd/dashboard`, `/hrd/users`, `/hrd/employees`, `/hrd/departments`, `/hrd/positions`, `/hrd/attendance`.

---

## Demo Accounts

| Username | Password | Role |
| -------- | -------- | ---- |
| `admin` | `password` | HRD |
| `employee` | `password` | EMPLOYEE |

> Seeded employees include a work location so the check-in geofence can be demonstrated. When creating a new employee, set its location (required) so that user can take attendance.

---

## Testing

```powershell
cd backend
npm.cmd test
```

Unit tests cover auth login, JWT and role guards, employee/department/position CRUD + the department↔position consistency rule, and the attendance business rules (duplicate check-in/out, check-out before check-in).

---

## Notes & Design Decisions

- **Validation** runs at the API Gateway (the HTTP boundary) using the shared DTO classes; services perform business-rule validation (existence, uniqueness, consistency).
- **Errors** thrown inside a service are serialized over TCP and re-mapped to the correct HTTP status at the gateway (400/401/403/404/409/500).
- **Geofence** — check-in/out is allowed only within `500 m` of the employee's registered location. The gateway fetches the employee profile (Employee Service) and computes the haversine distance before forwarding to the Attendance Service, keeping databases isolated.
- **Attendance photos** are stored on the filesystem under `uploads/attendance/{userId}/`, never as BLOBs; only the path is persisted. Uploads are validated for MIME type, size, sanitized filename, and path traversal.
- **Timestamps** for attendance are always generated by the server, never trusted from the client. `user_id` is taken from the JWT.
- **Maps** use Leaflet with OpenStreetMap tiles; address search uses the free Nominatim geocoder (no API key).
- **Oracle** access uses a connection pool with bind parameters only (no string concatenation); the `ATTENDANCE` table and its migrations (longitude columns, status constraint) are applied idempotently on service startup.
