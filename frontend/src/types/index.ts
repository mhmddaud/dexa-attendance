export type Role = 'EMPLOYEE' | 'HRD';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface User {
  id: number;
  username: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: number;
  departmentId: number;
  code: string;
  name: string;
  description?: string | null;
  department?: Pick<Department, 'id' | 'code' | 'name'>;
}

export interface Employee {
  id: number;
  userId: number;
  employeeNo: string;
  name: string;
  email: string;
  departmentId: number;
  positionId: number;
  latitude?: number | null;
  longitude?: number | null;
  department?: Pick<Department, 'id' | 'code' | 'name'>;
  position?: Pick<Position, 'id' | 'code' | 'name'>;
}

export interface Attendance {
  id: number;
  userId: number;
  attendanceDate: string;
  checkIn: string | null;
  photoCheckIn: string | null;
  latitudeCheckIn: number | null;
  longitudeCheckIn: number | null;
  noteCheckIn: string | null;
  checkOut: string | null;
  photoCheckOut: string | null;
  latitudeCheckOut: number | null;
  longitudeCheckOut: number | null;
  noteCheckOut: string | null;
  status: string;
  employee?: Employee | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalEmployees: number;
  today: {
    date: string;
    total: number;
    checkedIn: number;
    checkedOut: number;
  };
  absent: number;
}
