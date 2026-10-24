import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, ChevronLeft, ChevronRight, FilePenLine, Check, X } from 'lucide-react';
import { checkIn, checkOut, getAttendance, requestCorrection, approveCorrection } from '../api/attendance';
import { errMsg, toList } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, DataTable, Modal, Field, StatusBadge, Spinner } from '../components/ui.jsx';
import { isoDate, fmtTime, empName, MONTHS, pad } from '../utils.js';

const dayKey = (r) => String(r.date || r.checkIn || '').slice(0, 10);
const CAL_TONE = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  LATE: 'bg-amber-100 text-amber-800',
  HALF_DAY: 'bg-amber-100 text-amber-800',
  ABSENT: 'bg-rose-100 text-rose-800',
  LEAVE: 'bg-indigo-100 text-indigo-800',
  ON_LEAVE: 'bg-indigo-100 text-indigo-800',
};

function EmployeeView() {
  const toast = useToast();
  const now = new Date();
  const [cursor, setCursor] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [corr, setCorr] = useState(null); // { date, checkIn, checkOut, reason }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(toList(await getAttendance({ month: cursor.month, year: cursor.year }), 'attendance'));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);
  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => Object.fromEntries(records.map((r) => [dayKey(r), r])), [records]);
  const today = byDay[isoDate(now)];

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); await load(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const submitCorr = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestCorrection(corr);
      toast.success('Correction request submitted');
      setCorr(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const first = new Date(cursor.year, cursor.month - 1, 1);
  const daysIn = new Date(cursor.year, cursor.month, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const shift = (d) => setCursor((c) => {
    const m = c.month + d;
    return m < 1 ? { month: 12, year: c.year - 1 } : m > 12 ? { month: 1, year: c.year + 1 } : { ...c, month: m };
  });

  return (
    <>
      <PageHeader title="My Attendance" subtitle="Web check-in / check-out and your monthly calendar" />
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today · {now.toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
          <p className="mt-1 text-sm text-slate-700">
            In: <strong>{fmtTime(today?.checkIn)}</strong> &nbsp; Out: <strong>{fmtTime(today?.checkOut)}</strong>{' '}
            {today?.status && <StatusBadge status={today.status} />}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-success" disabled={busy || !!today?.checkIn} onClick={() => act(checkIn, 'Checked in')}><LogIn className="h-4 w-4" /> Check in</button>
          <button className="btn-danger" disabled={busy || !today?.checkIn || !!today?.checkOut} onClick={() => act(checkOut, 'Checked out')}><LogOut className="h-4 w-4" /> Check out</button>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{MONTHS[cursor.month - 1]} {cursor.year}</h2>
          <div className="flex gap-2">
            <button className="btn-secondary !px-2" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <button className="btn-secondary !px-2" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1 font-semibold text-slate-400">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = `${cursor.year}-${pad(cursor.month)}-${pad(d)}`;
              const r = byDay[key];
              const st = String(r?.status || (r?.checkIn ? 'PRESENT' : '')).toUpperCase();
              return (
                <button key={i} disabled={!r && key > isoDate(now)} title={r ? `${st} ${fmtTime(r.checkIn)}–${fmtTime(r.checkOut)}` : 'Request correction'}
                  onClick={() => setCorr({ date: key, checkIn: '', checkOut: '', reason: '' })}
                  className={`flex h-16 flex-col items-center justify-center rounded-lg border border-slate-100 ${CAL_TONE[st] || 'bg-slate-50 text-slate-500'} hover:ring-2 hover:ring-indigo-300 disabled:opacity-40`}>
                  <span className="text-sm font-semibold">{d}</span>
                  {r?.checkIn && <span className="text-[10px]">{fmtTime(r.checkIn)}</span>}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">Click a day to request an attendance correction.</p>
      </div>

      <Modal open={!!corr} onClose={() => setCorr(null)} title="Request attendance correction">
        {corr && (
          <form onSubmit={submitCorr} className="space-y-4">
            <Field label="Date"><input className="input" type="date" required value={corr.date} onChange={(e) => setCorr({ ...corr, date: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Correct check-in"><input type="time" className="input" required value={corr.checkIn} onChange={(e) => setCorr({ ...corr, checkIn: e.target.value })} /></Field>
              <Field label="Correct check-out"><input type="time" className="input" required value={corr.checkOut} onChange={(e) => setCorr({ ...corr, checkOut: e.target.value })} /></Field>
            </div>
            <Field label="Reason"><textarea className="input" rows={3} required value={corr.reason} onChange={(e) => setCorr({ ...corr, reason: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCorr(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}><FilePenLine className="h-4 w-4" /> Submit</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function StaffView() {
  const toast = useToast();
  const [tab, setTab] = useState('board');
  const [date, setDate] = useState(isoDate(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab === 'board' ? { date } : { correctionStatus: 'PENDING' };
      const list = toList(await getAttendance(params), 'attendance');
      setRows(tab === 'board' ? list : list.filter((r) => r.correction && String(r.correction.status).toUpperCase() === 'PENDING'));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date]);
  useEffect(() => { load(); }, [load]);

  const decide = async (r, status) => {
    try {
      await approveCorrection(r.correction?.id ?? r.correctionId, status);
      toast.success(`Correction ${status.toLowerCase()}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const base = [
    { key: 'emp', header: 'Employee', render: (r) => <span className="font-medium text-slate-900">{empName(r.employee || r.user) !== '—' ? empName(r.employee || r.user) : r.employeeName || '—'}</span> },
    { key: 'department', header: 'Department', render: (r) => r.department || r.employee?.department || '—' },
    { key: 'date', header: 'Date', render: (r) => dayKey(r) || '—' },
    { key: 'checkIn', header: 'Check in', render: (r) => fmtTime(r.checkIn) },
    { key: 'checkOut', header: 'Check out', render: (r) => fmtTime(r.checkOut) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || (r.checkIn ? 'PRESENT' : 'ABSENT')} /> },
  ];
  const corrCols = [
    ...base,
    { key: 'reason', header: 'Reason', render: (r) => r.correction?.reason || '—' },
    { key: 'actions', header: 'Action', render: (r) => (
      <div className="flex gap-1">
        <button className="btn-success !px-2 !py-1" onClick={() => decide(r, 'APPROVED')} aria-label="Approve"><Check className="h-4 w-4" /></button>
        <button className="btn-danger !px-2 !py-1" onClick={() => decide(r, 'REJECTED')} aria-label="Reject"><X className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Attendance" subtitle="Daily board and correction approvals"
        actions={tab === 'board' && <input type="date" className="input !w-44" value={date} onChange={(e) => setDate(e.target.value)} />} />
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {[['board', 'Daily board'], ['corrections', 'Pending corrections']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{l}</button>
        ))}
      </div>
      <DataTable columns={tab === 'board' ? base : corrCols} rows={rows} loading={loading} empty={tab === 'board' ? 'No attendance recorded for this day' : 'No pending corrections'} />
    </>
  );
}

export default function Attendance() {
  const { role } = useAuth();
  return role === 'EMPLOYEE' ? <EmployeeView /> : <StaffView />;
}
