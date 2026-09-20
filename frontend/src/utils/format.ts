/** Format an ISO timestamp as a readable local time (HH:mm:ss). */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Format a date string (YYYY-MM-DD or ISO) as a readable local date. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatLatitude(lat: number | null | undefined): string {
  return lat === null || lat === undefined ? '-' : lat.toFixed(7);
}
