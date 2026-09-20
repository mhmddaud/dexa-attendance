import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { Loading } from '../../components/ui/Loading';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../../services/user.service';
import { apiErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/format';
import type { Role, User } from '../../types';

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'HRD', label: 'HRD' },
];

const emptyForm = { username: '', password: '', role: 'EMPLOYEE' as Role };

export function HrdUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ page, limit: 10, search: search || undefined });
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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ username: user.username, password: '', role: user.role });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.username.trim() || (!editing && !form.password.trim())) {
      setFormError('Username and password are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        // Only send password if the field was filled in.
        const payload: { username: string; role: Role; password?: string } = {
          username: form.username.trim(),
          role: form.role,
        };
        if (form.password.trim()) payload.password = form.password.trim();
        await updateUser(editing.id, payload);
      } else {
        await createUser({
          username: form.username.trim(),
          password: form.password.trim(),
          role: form.role,
        });
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
      await deleteUser(deleteTarget.id);
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
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <Button onClick={openCreate}>+ New User</Button>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <Card>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Search by username"
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
              keyField={(u) => u.id}
              columns={[
                { header: 'ID', accessor: (u) => u.id },
                { header: 'Username', accessor: (u) => u.username },
                {
                  header: 'Role',
                  accessor: (u) => (
                    <Badge tone={u.role === 'HRD' ? 'blue' : 'gray'}>{u.role}</Badge>
                  ),
                },
                { header: 'Created', accessor: (u) => formatDate(u.createdAt) },
                {
                  header: 'Actions',
                  accessor: (u) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(u)}>
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
        title={editing ? 'Edit User' : 'New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label={editing ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editing ? '••••••••' : ''}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            options={ROLE_OPTIONS}
          />
          <p className="text-xs text-slate-400">
            The user id created here is what you reference as “User ID” when adding
            an employee profile.
          </p>
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
        title="Delete User"
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
          <span className="font-semibold">{deleteTarget?.username}</span>? Any
          employee profile linked to this user will lose its login account.
        </p>
      </Modal>
    </div>
  );
}
