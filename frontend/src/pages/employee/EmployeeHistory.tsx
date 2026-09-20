import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { myAttendance } from '../../services/attendance.service';
import { apiErrorMessage, resolveUpload } from '../../services/api';
import { formatDate, formatLatitude, formatTime } from '../../utils/format';
import type { Attendance } from '../../types';

function PhotoThumb({ path, alt }: { path: string | null; alt: string }) {
  if (!path) return <span className="text-slate-300">-</span>;
  return (
    <a href={resolveUpload(path)} target="_blank" rel="noreferrer">
      <img
        src={resolveUpload(path)}
        alt={alt}
        className="h-10 w-10 rounded object-cover ring-1 ring-slate-200"
      />
    </a>
  );
}

export function EmployeeHistory() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function load(params?: { startDate?: string; endDate?: string }) {
    setLoading(true);
    setError(null);
    try {
      setRecords(await myAttendance(params));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Attendance History</h1>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="sm:w-44"
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="sm:w-44"
          />
          <Button
            onClick={() =>
              load({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              })
            }
          >
            Filter
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              void load();
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Loading />
      ) : (
        <Card className="!p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Date',
                    'Check In',
                    'Photo In',
                    'Lat In',
                    'Note In',
                    'Check Out',
                    'Photo Out',
                    'Lat Out',
                    'Note Out',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3 py-3 text-left font-semibold text-slate-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-slate-400">
                      No attendance records
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(r.attendanceDate)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatTime(r.checkIn)}</td>
                      <td className="px-3 py-3"><PhotoThumb path={r.photoCheckIn} alt="Check in" /></td>
                      <td className="whitespace-nowrap px-3 py-3">{formatLatitude(r.latitudeCheckIn)}</td>
                      <td className="max-w-[10rem] truncate px-3 py-3">{r.noteCheckIn ?? '-'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatTime(r.checkOut)}</td>
                      <td className="px-3 py-3"><PhotoThumb path={r.photoCheckOut} alt="Check out" /></td>
                      <td className="whitespace-nowrap px-3 py-3">{formatLatitude(r.latitudeCheckOut)}</td>
                      <td className="max-w-[10rem] truncate px-3 py-3">{r.noteCheckOut ?? '-'}</td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="space-y-3 p-4 md:hidden">
            {records.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No attendance records
              </p>
            ) : (
              records.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{formatDate(r.attendanceDate)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <p className="font-medium text-slate-400">Check In</p>
                      <p>{formatTime(r.checkIn)}</p>
                      <PhotoThumb path={r.photoCheckIn} alt="Check in" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-400">Check Out</p>
                      <p>{formatTime(r.checkOut)}</p>
                      <PhotoThumb path={r.photoCheckOut} alt="Check out" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
