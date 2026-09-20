import { api } from './api';
import type { PaginatedResult, Role, User } from '../types';

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<User>> {
  const { data } = await api.get('/api/users', { params });
  return data;
}

export async function createUser(payload: {
  username: string;
  password: string;
  role: Role;
}): Promise<User> {
  const { data } = await api.post('/api/users', payload);
  return data;
}

export async function updateUser(
  id: number,
  payload: { username?: string; password?: string; role?: Role },
): Promise<User> {
  const { data } = await api.patch(`/api/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}`);
}
