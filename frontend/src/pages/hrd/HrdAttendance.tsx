import { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Loading } from '../../components/ui/Loading';
import { StatusBadge } from '../../components/ui/Badge';
import { LocationMap } from '../../components/LocationMap';
import { listAttendance, markAbsent } from '../../services/attendance.service';
import { listDepartments } from '../../services/employee.service';
import { apiErrorMessage, resolveUpload } from '../../services/api';
import { formatDate, formatLatitude, formatTime } from '../../utils/format';
import type { Attendance, Department } from '../../types';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
];

export function HrdAttendance() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Attendance | null>(null);
  const [absentDate, setAbsentDate] = useState('');
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    departmentId: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAttendance({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
      });
      // Department filter is applied client-side using the enriched employee data.
      const filtered = filters.departmentId
        ? data.filter(
            (r) => r.employee?.department?.id === Number(filters.departmentId),
          )
        : data;
      setRecords(filtered);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listDepartments({ page: 1, limit: 100 })
      .then((res) => setDepartments(res.data))
      .catch(() => undefined);
  }, []);

  async function handleMarkAbsent() {
    setMarkingAbsent(true);
    setError(null);
    setInfo(null);
    try {
      const res = await markAbsent(absentDate || undefined);
      setInfo(
        `Marked ${res.marked} employee(s) as ABSENT for ${res.date} (${res.skipped} already had a record).`,
      );
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setMarkingAbsent(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <div className="flex items-end gap-2">
          <Input
            label="Mark absent for date"
            type="date"
            value={absentDate}
            onChange={(e) => setAbsentDate(e.target.value)}
            className="sm:w-44"
          />
          <Button
            variant="secondary"
            loading={markingAbsent}
            onClick={handleMarkAbsent}
          >
            Mark Absent
          </Button>
        </div>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {info && <Alert tone="success" onClose={() => setInfo(null)}>{info}</Alert>}

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Department"
            placeholder="All departments"
            value={filters.departmentId}
            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={STATUS_OPTIONS}
          />
          <div className="flex items-end gap-2">
            <Button onClick={load}>Filter</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ departmentId: '', startDate: '', endDate: '', status: '' });
                setTimeout(load, 0);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <Card className="!p-0">
          <div className="p-2">
            <Table
              data={records}
              keyField={(r) => r.id}
              empty="No attendance records"
              columns={[
                { header: 'Employee', accessor: (r) => r.employee?.name ?? `User #${r.userId}` },
                { header: 'Employee No', accessor: (r) => r.employee?.employeeNo ?? '-' },
                { header: 'Department', accessor: (r) => r.employee?.department?.name ?? '-' },
                { header: 'Position', accessor: (r) => r.employee?.position?.name ?? '-' },
                { header: 'Date', accessor: (r) => formatDate(r.attendanceDate) },
                { header: 'Check In', accessor: (r) => formatTime(r.checkIn) },
                { header: 'Check Out', accessor: (r) => formatTime(r.checkOut) },
                { header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
                {
                  header: 'Detail',
                  accessor: (r) => (
                    <Button size="sm" variant="secondary" onClick={() => setDetail(r)}>
                      View
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Attendance Detail"
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {detail.employee?.name ?? `User #${detail.userId}`}
                </p>
                <p className="text-sm text-slate-500">
                  {detail.employee?.department?.name} · {detail.employee?.position?.name}
                </p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailBlock
                title="Check In"
                time={formatTime(detail.checkIn)}
                photo={detail.photoCheckIn}
                latitude={detail.latitudeCheckIn}
                longitude={detail.longitudeCheckIn}
                note={detail.noteCheckIn}
              />
              <DetailBlock
                title="Check Out"
                time={formatTime(detail.checkOut)}
                photo={detail.photoCheckOut}
                latitude={detail.latitudeCheckOut}
                longitude={detail.longitudeCheckOut}
                note={detail.noteCheckOut}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailBlock({
  title,
  time,
  photo,
  latitude,
  longitude,
  note,
}: {
  title: string;
  time: string;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
}) {
  const hasCoords = latitude !== null && longitude !== null;
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      {photo ? (
        <a href={resolveUpload(photo)} target="_blank" rel="noreferrer">
          <img
            src={resolveUpload(photo)}
            alt={title}
            className="mb-3 h-40 w-full rounded object-cover ring-1 ring-slate-200"
          />
        </a>
      ) : (
        <div className="mb-3 flex h-40 items-center justify-center rounded bg-slate-50 text-sm text-slate-400">
          No photo
        </div>
      )}

      {hasCoords ? (
        <div className="mb-3">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            label={title}
            height={160}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-brand-600 hover:underline"
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
      ) : (
        <div className="mb-3 flex h-40 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">
          No location data
        </div>
      )}

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Time</dt>
          <dd className="text-slate-700">{time}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Latitude</dt>
          <dd className="text-slate-700">{formatLatitude(latitude)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Longitude</dt>
          <dd className="text-slate-700">{formatLatitude(longitude)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Note</dt>
          <dd className="text-slate-700">{note ?? '-'}</dd>
        </div>
      </dl>
    </div>
  );
}
