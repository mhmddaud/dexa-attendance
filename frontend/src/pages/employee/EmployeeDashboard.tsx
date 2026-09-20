import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, StatCard } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getMyProfile } from '../../services/employee.service';
import { myAttendance } from '../../services/attendance.service';
import { apiErrorMessage } from '../../services/api';
import { formatDate, formatTime } from '../../utils/format';
import type { Attendance, Employee } from '../../types';

export function EmployeeDashboard() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, att] = await Promise.all([getMyProfile(), myAttendance()]);
        setProfile(p);
        setRecords(att);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.attendanceDate === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome{profile ? `, ${profile.name}` : ''}
        </h1>
        <p className="text-sm text-slate-500">Here is your attendance overview.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {profile && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Employee No" value={profile.employeeNo} icon="🪪" />
          <StatCard
            label="Department"
            value={profile.department?.name ?? '-'}
            icon="🏢"
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Position"
            value={profile.position?.name ?? '-'}
            icon="💼"
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Today's Status"
            value={
              todayRecord ? <StatusBadge status={todayRecord.status} /> : <Badge>Not checked in</Badge>
            }
            icon="📅"
            accent="bg-green-50 text-green-600"
          />
        </div>
      )}

      <Card
        title="Today's Attendance"
        actions={
          <Link to="/employee/attendance">
            <Button size="sm">Go to Attendance</Button>
          </Link>
        }
      >
        {todayRecord ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Check In</p>
              <p className="mt-1 text-lg font-semibold text-slate-700">
                {formatTime(todayRecord.checkIn)}
              </p>
              <p className="text-xs text-slate-500">{todayRecord.noteCheckIn ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Check Out</p>
              <p className="mt-1 text-lg font-semibold text-slate-700">
                {formatTime(todayRecord.checkOut)}
              </p>
              <p className="text-xs text-slate-500">{todayRecord.noteCheckOut ?? '-'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            You have not checked in today. Head to the attendance page to check in.
          </p>
        )}
      </Card>

      <Card title="Recent Attendance">
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">No attendance records yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {records.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(r.attendanceDate)}
                  </p>
                  <p className="text-xs text-slate-500">
                    In {formatTime(r.checkIn)} · Out {formatTime(r.checkOut)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
