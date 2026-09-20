import { api } from './api';
import type {
  Department,
  Employee,
  PaginatedResult,
  Position,
} from '../types';

// ---------- Departments ----------
export async function listDepartments(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<Department>> {
  const { data } = await api.get('/api/departments', { params });
  return data;
}

export async function getDepartment(id: number): Promise<Department> {
  const { data } = await api.get(`/api/departments/${id}`);
  return data;
}

export async function createDepartment(
  payload: Partial<Department>,
): Promise<Department> {
  const { data } = await api.post('/api/departments', payload);
  return data;
}

export async function updateDepartment(
  id: number,
  payload: Partial<Department>,
): Promise<Department> {
  const { data } = await api.patch(`/api/departments/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await api.delete(`/api/departments/${id}`);
}

export async function positionsByDepartment(
  departmentId: number,
): Promise<Position[]> {
  const { data } = await api.get(
    `/api/departments/${departmentId}/positions`,
  );
  return data;
}

// ---------- Positions ----------
export async function listPositions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
}): Promise<PaginatedResult<Position>> {
  const { data } = await api.get('/api/positions', { params });
  return data;
}

export async function createPosition(
  payload: Partial<Position>,
): Promise<Position> {
  const { data } = await api.post('/api/positions', payload);
  return data;
}

export async function updatePosition(
  id: number,
  payload: Partial<Position>,
): Promise<Position> {
  const { data } = await api.patch(`/api/positions/${id}`, payload);
  return data;
}

export async function deletePosition(id: number): Promise<void> {
  await api.delete(`/api/positions/${id}`);
}

// ---------- Employees ----------
export async function listEmployees(params?: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  positionId?: number;
}): Promise<PaginatedResult<Employee>> {
  const { data } = await api.get('/api/employees', { params });
  return data;
}

export async function getMyProfile(): Promise<Employee> {
  const { data } = await api.get('/api/employees/me');
  return data;
}

export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await api.get(`/api/employees/${id}`);
  return data;
}

export async function createEmployee(
  payload: Partial<Employee>,
): Promise<Employee> {
  const { data } = await api.post('/api/employees', payload);
  return data;
}

export async function updateEmployee(
  id: number,
  payload: Partial<Employee>,
): Promise<Employee> {
  const { data } = await api.patch(`/api/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/api/employees/${id}`);
}
