import React, { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { getAnnouncements, createAnnouncement } from '../api/m9';
import { getSetup } from '../api/setup';
import { errMsg, toList } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Modal, Field, Spinner, Badge } from '../components/ui.jsx';
import { fmtDateTime } from '../utils.js';

export default function Announcements() {
  const { role } = useAuth();
  const toast = useToast();
  const canPost = role === 'ADMIN' || role === 'HR';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', targetDepartment: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(toList(await getAnnouncements(), 'announcements')); } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (canPost) getSetup().then((d) => setDepartments((d.setup || d).departments || [])).catch(() => {});
  }, [canPost]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAnnouncement({ ...form, targetDepartment: form.targetDepartment || 'ALL' });
      toast.success('Announcement published');
      setOpen(false);
      setForm({ title: '', content: '', targetDepartment: '' });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="Company and department updates"
        actions={canPost && <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New announcement</button>} />

      {loading ? <div className="flex justify-center py-16"><Spinner className="!h-8 !w-8" /></div> : items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400"><Megaphone className="mx-auto mb-2 h-8 w-8" />No announcements yet</div>
      ) : (
        <div className="space-y-4">
          {items.map((a, i) => (
            <article key={a.id ?? i} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{a.title}</h2>
                <Badge tone={!a.targetDepartment || a.targetDepartment === 'ALL' ? 'indigo' : 'amber'}>{a.targetDepartment || 'ALL'}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{a.content}</p>
              <p className="mt-3 text-xs text-slate-400">{fmtDateTime(a.createdAt)}{a.createdBy?.firstName ? ` · ${a.createdBy.firstName}` : ''}</p>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New announcement">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Content"><textarea className="input" rows={5} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
          <Field label="Target department">
            <select className="input" value={form.targetDepartment} onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}>
              <option value="">All departments</option>{departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
