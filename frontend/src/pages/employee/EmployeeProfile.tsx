import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Alert } from '../../components/ui/Alert';
import { getMyProfile } from '../../services/employee.service';
import { apiErrorMessage } from '../../services/api';
import type { Employee } from '../../types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-slate-100 py-3 sm:flex-row sm:items-center">
      <span className="w-48 text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

export function EmployeeProfile() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setProfile(await getMyProfile());
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
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
      {error && <Alert tone="error">{error}</Alert>}
      {profile && (
        <Card>
          <Row label="Employee No" value={profile.employeeNo} />
          <Row label="Name" value={profile.name} />
          <Row label="Email" value={profile.email} />
          <Row label="Department" value={profile.department?.name ?? '-'} />
          <Row label="Position" value={profile.position?.name ?? '-'} />
        </Card>
      )}
      <p className="text-xs text-slate-400">
        Master data (department and position) can only be changed by HRD.
      </p>
    </div>
  );
}
