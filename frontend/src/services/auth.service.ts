import { api } from './api';
import type { LoginResponse } from '../types';

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', {
    username,
    password,
  });
  return data;
}
