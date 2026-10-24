import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Send, Check, X } from 'lucide-react';
import { applyLeave, getLeaves, updateLeaveStatus } from '../api/leave';
import { sendAiPrompt } from '../api/ai';
import { errMsg, toList } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, DataTable, Modal, Field, StatusBadge, Spinner } from '../components/ui.jsx';
import { fmtDate, empName } from '../utils.js';

const TYPES = ['ANNUAL', 'SICK', 'CASUAL'];

export default function Leave() {
  const { role } = useAuth();
  const toast = useToast();
  const staff = role !== 'EMPLOYEE';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [smart, setSmart] = useState('');
  const [smartBusy, setSmartBusy] = useState(false);
  const [smartReply, setSmartReply] = useState('');

  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const [decision, setDecision] = useState(null); // { leave, status, comment }

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(toList(await getLeaves(), 'leaves')); } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  // Point 21: Smart Leave — free-text sentence is parsed by the backend AI
  const runSmart = async (e) => {
    e.preventDefault();
    if (!smart.trim()) return;
    setSmartBusy(true);
    setSmartReply('');
    try {
      const res = await sendAiPrompt(smart.trim());
      setSmartReply(res.aiResponse || 'Request processed.');
      setSmart('');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSmartBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await applyLeave(form);
      toast.success('Leave request submitted');
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const decide = async (e) => {
    e.preventDefault();
    try {
      await updateLeaveStatus(decision.leave.id, decision.status, decision.comment);
      toast.success(`Leave ${decision.status.toLowerCase()}`);
      setDecision(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const visible = filter === 'ALL' ? rows : rows.filter((r) => String(r.status).toUpperCase() === filter);
  const columns = [
    ...(staff ? [{ key: 'emp', header: 'Employee', render: (r) => <span className="font-medium text-slate-900">{empName(r.employee || r.user) !== '—' ? empName(r.employee || r.user) : r.employeeName || '—'}</span> }] : []),
    { key: 'leaveType', header: 'Type' },
    { key: 'startDate', header: 'From', render: (r) => fmtDate(r.startDate) },
    { key: 'endDate', header: 'To', render: (r) => fmtDate(r.endDate) },
    { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-2 max-w-xs">{r.reason || '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'comment', header: 'Comment', render: (r) => r.comment || '—' },
    ...(staff ? [{ key: 'actions', header: 'Action', render: (r) =>
      String(r.status).toUpperCase() === 'PENDING' ? (
        <div className="flex gap-1">
          <button className="btn-success !px-2 !py-1" aria-label="Approve" onClick={() => setDecision({ leave: r, status: 'APPROVED', comment: '' })}><Check className="h-4 w-4" /></button>
          <button className="btn-danger !px-2 !py-1" aria-label="Reject" onClick={() => setDecision({ leave: r, status: 'REJECTED', comment: '' })}><X className="h-4 w-4" /></button>
        </div>
      ) : '—' }] : []),
  ];

  return (
    <>
      <PageHeader title={staff ? 'Leave Approvals' : 'My Leave'} subtitle={staff ? 'Review and decide on leave requests' : 'Apply for leave using a sentence or the form'} />

      {!staff && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <form onSubmit={runSmart} className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-indigo-600" /> Smart Leave</h2>
            <p className="text-sm text-slate-500">Describe it naturally, e.g. “I need sick leave from tomorrow for 2 days, I have a fever.”</p>
            <textarea className="input" rows={3} value={smart} onChange={(e) => setSmart(e.target.value)} placeholder="Type your leave request…" />
            <button className="btn-primary" disabled={smartBusy || !smart.trim()}>{smartBusy ? <Spinner className="!h-4 !w-4" /> : <Send className="h-4 w-4" />} Submit with AI</button>
            {smartReply && <p className="whitespace-pre-wrap rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">{smartReply}</p>}
          </form>

          <form onSubmit={submit} className="card space-y-3 p-5">
            <h2 className="font-semibold text-slate-900">Apply manually</h2>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type"><select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Start"><input type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
              <Field label="End"><input type="date" required min={form.startDate} className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
            </div>
            <Field label="Reason"><input className="input" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
            <button className="btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Apply'}</button>
          </form>
        </div>
      )}

      <div className="mb-3 flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{s}</button>
        ))}
      </div>
      <DataTable columns={columns} rows={visible} loading={loading} empty="No leave requests" />

      <Modal open={!!decision} onClose={() => setDecision(null)} title={decision ? `${decision.status === 'APPROVED' ? 'Approve' : 'Reject'} leave request` : ''}>
        {decision && (
          <form onSubmit={decide} className="space-y-4">
            <p className="text-sm text-slate-600">{empName(decision.leave.employee || decision.leave.user)} · {decision.leave.leaveType} · {fmtDate(decision.leave.startDate)} → {fmtDate(decision.leave.endDate)}</p>
            <Field label="Comment"><textarea className="input" rows={3} required={decision.status === 'REJECTED'} value={decision.comment} onChange={(e) => setDecision({ ...decision, comment: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setDecision(null)}>Cancel</button>
              <button className={decision.status === 'APPROVED' ? 'btn-success' : 'btn-danger'}>Confirm {decision.status === 'APPROVED' ? 'approval' : 'rejection'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
