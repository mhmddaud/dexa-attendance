import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { LocationPicker } from '../../components/LocationPicker';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { Loading } from '../../components/ui/Loading';
import { Pagination } from '../../components/ui/Pagination';
import {
  createEmployee,
  deleteEmployee,
  listDepartments,
  listEmployees,
  positionsByDepartment,
  updateEmployee,
} from '../../services/employee.service';
import { listUsers } from '../../services/user.service';
import { apiErrorMessage } from '../../services/api';
import type { Department, Employee, Position, User } from '../../types';

const emptyForm = {
  userId: '',
  employeeNo: '',
  name: '',
  email: '',
  departmentId: '',
  positionId: '',
  latitude: null as number | null,
  longitude: null as number | null,
};

export function HrdEmployees() {
  const [items, setItems] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listEmployees({ page, limit: 10, search: search || undefined });
      setItems(res.data);
      setMeta({ total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listDepartments({ page: 1, limit: 100 })
      .then((res) => setDepartments(res.data))
      .catch(() => undefined);
    // Load user accounts to populate the searchable User dropdown.
    // limit is capped at 100 by the backend PaginationQueryDto.
    listUsers({ page: 1, limit: 100 })
      .then((res) => setUsers(res.data))
      .catch(() => undefined);
  }, []);

  // Load positions whenever the selected department changes.
  const loadPositions = useCallback(async (departmentId: string) => {
    if (!departmentId) {
      setPositions([]);
      return;
    }
    try {
      setPositions(await positionsByDepartment(Number(departmentId)));
    } catch {
      setPositions([]);
    }
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPositions([]);
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      userId: String(emp.userId),
      employeeNo: emp.employeeNo,
      name: emp.name,
      email: emp.email,
      departmentId: String(emp.departmentId),
      positionId: String(emp.positionId),
      latitude: emp.latitude ?? null,
      longitude: emp.longitude ?? null,
    });
    setFormError(null);
    await loadPositions(String(emp.departmentId));
    setModalOpen(true);
  }

  function onDepartmentChange(departmentId: string) {
    // Reset the dependent position when the department changes.
    setForm((f) => ({ ...f, departmentId, positionId: '' }));
    void loadPositions(departmentId);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (
      !form.userId ||
      !form.employeeNo.trim() ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.departmentId ||
      !form.positionId
    ) {
      setFormError('All fields are required');
      return;
    }
    if (form.latitude === null || form.longitude === null) {
      setFormError('Please choose the employee location on the map');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userId: Number(form.userId),
        employeeNo: form.employeeNo.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        departmentId: Number(form.departmentId),
        positionId: Number(form.positionId),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
      };
      if (editing) {
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
        <Button onClick={openCreate}>+ New Employee</Button>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <Card>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Search by name, email or employee no"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <Table
              data={items}
              keyField={(e) => e.id}
              columns={[
                { header: 'Employee No', accessor: (e) => e.employeeNo },
                { header: 'Name', accessor: (e) => e.name },
                { header: 'Email', accessor: (e) => e.email },
                { header: 'Department', accessor: (e) => e.department?.name ?? '-' },
                { header: 'Position', accessor: (e) => e.position?.name ?? '-' },
                {
                  header: 'Actions',
                  accessor: (e) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(e)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'New Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect
              label="User Account"
              placeholder="Search by username"
              value={form.userId ? Number(form.userId) : ''}
              onChange={(v) => setForm({ ...form, userId: String(v) })}
              options={users.map((u) => ({
                value: u.id,
                label: u.username,
                hint: u.role,
              }))}
              emptyText="No user accounts found"
            />
            <Input
              label="Employee No"
              value={form.employeeNo}
              onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Department"
              placeholder="Select a department"
              value={form.departmentId}
              onChange={(e) => onDepartmentChange(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Position"
              placeholder={
                form.departmentId ? 'Select a position' : 'Select a department first'
              }
              value={form.positionId}
              disabled={!form.departmentId}
              onChange={(e) => setForm({ ...form, positionId: e.target.value })}
              options={positions.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
          <p className="text-xs text-slate-400">
            The position list depends on the selected department; a position from
            a different department cannot be chosen.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Location <span className="text-red-500">*</span>
            </label>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) =>
                setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Employee"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteTarget?.name}</span>?
        </p>
      </Modal>
    </div>
  );
}
