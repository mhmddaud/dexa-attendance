import { api } from './api';
import type { Attendance, DashboardSummary } from '../types';

export async function checkIn(
  photo: Blob,
  latitude: number,
  longitude: number,
  note?: string,
): Promise<Attendance> {
  const form = new FormData();
  form.append('photo', photo, 'checkin.jpg');
  form.append('latitude', String(latitude));
  form.append('longitude', String(longitude));
  if (note) form.append('note', note);
  const { data } = await api.post('/api/attendance/check-in', form);
  return data;
}

export async function checkOut(
  photo: Blob,
  latitude: number,
  longitude: number,
  note?: string,
): Promise<Attendance> {
  const form = new FormData();
  form.append('photo', photo, 'checkout.jpg');
  form.append('latitude', String(latitude));
  form.append('longitude', String(longitude));
  if (note) form.append('note', note);
  const { data } = await api.post('/api/attendance/check-out', form);
  return data;
}

export async function myAttendance(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Attendance[]> {
  const { data } = await api.get('/api/attendance/me', { params });
  return data;
}

export async function listAttendance(params?: {
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<Attendance[]> {
  const { data } = await api.get('/api/attendance', { params });
  return data;
}

export async function getAttendance(id: number): Promise<Attendance> {
  const { data } = await api.get(`/api/attendance/${id}`);
  return data;
}

export async function dashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/api/dashboard/summary');
  return data;
}

export async function markAbsent(date?: string): Promise<{
  date: string;
  marked: number;
  skipped: number;
}> {
  const { data } = await api.post('/api/attendance/mark-absent', { date });
  return data;
}
