import { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loading } from '../../components/ui/Loading';
import { StatusBadge } from '../../components/ui/Badge';
import { CameraCapture } from '../../components/CameraCapture';
import { useGeolocation } from '../../hooks/useGeolocation';
import {
  checkIn as checkInReq,
  checkOut as checkOutReq,
  myAttendance,
} from '../../services/attendance.service';
import { apiErrorMessage } from '../../services/api';
import { formatTime } from '../../utils/format';
import type { Attendance } from '../../types';

type Mode = 'checkin' | 'checkout';

export function EmployeeAttendance() {
  const geo = useGeolocation();
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    try {
      const records = await myAttendance();
      const iso = new Date().toISOString().slice(0, 10);
      setToday(records.find((r) => r.attendanceDate === iso) ?? null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const mode: Mode = !today || !today.checkIn ? 'checkin' : 'checkout';
  const alreadyDone = !!today && !!today.checkIn && !!today.checkOut;

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!photo) {
      setError('Please capture a photo first.');
      return;
    }

    let coords: { latitude: number; longitude: number };
    try {
      coords = await geo.request();
    } catch (err) {
      setError(apiErrorMessage(err, 'Location is required to submit attendance.'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'checkin') {
        await checkInReq(photo, coords.latitude, coords.longitude, note || undefined);
        setSuccess('Check-in successful.');
      } else {
        await checkOutReq(photo, coords.latitude, coords.longitude, note || undefined);
        setSuccess('Check-out successful.');
      }
      setPhoto(null);
      setNote('');
      await loadToday();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-sm text-slate-500">
          {mode === 'checkin'
            ? 'Capture your photo, confirm your location, and check in.'
            : 'Capture your photo, confirm your location, and check out.'}
        </p>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && (
        <Alert tone="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {today && (
        <Card title="Today's Record">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-slate-400">Status</p>
              <StatusBadge status={today.status} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Check In</p>
              <p className="text-sm font-medium">{formatTime(today.checkIn)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Check Out</p>
              <p className="text-sm font-medium">{formatTime(today.checkOut)}</p>
            </div>
          </div>
        </Card>
      )}

      {alreadyDone ? (
        <Alert tone="info">
          You have completed both check-in and check-out for today.
        </Alert>
      ) : (
        <Card title={mode === 'checkin' ? 'Check In' : 'Check Out'}>
          <div className="space-y-4">
            <CameraCapture
              onCapture={(blob) => setPhoto(blob)}
              onClear={() => setPhoto(null)}
            />

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-600">Location</p>
              {geo.latitude !== null ? (
                <p className="text-slate-700">Latitude: {geo.latitude.toFixed(7)}</p>
              ) : (
                <p className="text-slate-400">
                  Latitude will be captured on submit.
                </p>
              )}
              {geo.error && <p className="text-red-600">{geo.error}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder={
                  mode === 'checkin' ? 'e.g. Arrived at office' : 'e.g. Finished work'
                }
              />
            </div>

            <Button
              onClick={handleSubmit}
              loading={submitting || geo.loading}
              disabled={!photo}
              className="w-full"
            >
              {mode === 'checkin' ? 'CHECK IN' : 'CHECK OUT'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
