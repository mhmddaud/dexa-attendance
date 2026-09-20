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
import {
  createPosition,
  deletePosition,
  listDepartments,
  listPositions,
  updatePosition,
} from '../../services/employee.service';
import { apiErrorMessage } from '../../services/api';
import type { Department, Position } from '../../types';

const emptyForm = { departmentId: '', code: '', name: '', description: '' };

export function HrdPositions() {
  const [items, setItems] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPositions({ page, limit: 10, search: search || undefined });
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
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(pos: Position) {
    setEditing(pos);
    setForm({
      departmentId: String(pos.departmentId),
      code: pos.code,
      name: pos.name,
      description: pos.description ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.departmentId || !form.code.trim() || !form.name.trim()) {
      setFormError('Department, code and name are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        departmentId: Number(form.departmentId),
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await updatePosition(editing.id, payload);
      } else {
        await createPosition(payload);
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
      await deletePosition(deleteTarget.id);
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
        <h1 className="text-2xl font-bold text-slate-800">Positions</h1>
        <Button onClick={openCreate}>+ New Position</Button>
      </div>

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <Card>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Search by code or name"
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
              keyField={(p) => p.id}
              columns={[
                { header: 'Code', accessor: (p) => p.code },
                { header: 'Name', accessor: (p) => p.name },
                { header: 'Department', accessor: (p) => p.department?.name ?? '-' },
                { header: 'Description', accessor: (p) => p.description ?? '-' },
                {
                  header: 'Actions',
                  accessor: (p) => (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(p)}>
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
        title={editing ? 'Edit Position' : 'New Position'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <Select
            label="Department"
            placeholder="Select a department"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
        title="Delete Position"
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
          Delete <span className="font-semibold">{deleteTarget?.name}</span>?
          Positions still used by employees cannot be deleted.
        </p>
      </Modal>
    </div>
  );
}
