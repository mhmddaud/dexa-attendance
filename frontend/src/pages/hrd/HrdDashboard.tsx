import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { dashboardSummary } from '../../services/attendance.service';
import { apiErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';
import type { DashboardSummary } from '../../types';

export function HrdDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setSummary(await dashboardSummary());
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">HRD Dashboard</h1>
        {summary && (
          <p className="text-sm text-slate-500">
            Attendance summary for {formatDate(summary.today.date)}
          </p>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Employees" value={summary.totalEmployees} icon="👥" />
          <StatCard
            label="Records Today"
            value={summary.today.total}
            icon="🗓️"
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Checked In"
            value={summary.today.checkedIn}
            icon="✅"
            accent="bg-green-50 text-green-600"
          />
          <StatCard
            label="Checked Out"
            value={summary.today.checkedOut}
            icon="🏁"
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Absent"
            value={summary.absent}
            icon="🚫"
            accent="bg-red-50 text-red-600"
          />
        </div>
      )}
    </div>
  );
}
