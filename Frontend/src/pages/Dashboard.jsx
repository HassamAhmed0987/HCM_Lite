import React, { useEffect, useState } from 'react';
import { Users, CalendarClock, UserCheck, Wallet, ScrollText, Sparkles, Megaphone, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getEmployees } from '../api/employee';
import { getLeaves } from '../api/leave';
import { getAttendance } from '../api/attendance';
import { getPayrolls } from '../api/payroll';
import { getAnnouncements, getAuditLogs } from '../api/m9';
import { sendAiPrompt } from '../api/ai';
import { errMsg, toList } from '../api/client';
import { PageHeader, StatCard, Spinner, StatusBadge } from '../components/ui.jsx';
import { isoDate, fmtDate, fmtTime } from '../utils.js';

const val = (r, fallback = 0) => (r.status === 'fulfilled' ? r.value : fallback);

function Announcements({ items }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Megaphone className="h-4 w-4 text-indigo-600" /> Latest announcements</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.slice(0, 4).map((a, i) => (
            <li key={a.id ?? i} className="border-l-2 border-indigo-400 pl-3">
              <p className="text-sm font-medium text-slate-800">{a.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{a.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AiInsights({ prompt, title }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const run = async () => {
    setBusy(true);
    try {
      const res = await sendAiPrompt(prompt);
      setText(res.aiResponse || 'No insight returned.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-indigo-600" /> {title}</h2>
        <button className="btn-secondary" onClick={run} disabled={busy}>{busy ? <Spinner className="!h-4 !w-4" /> : 'Generate'}</button>
      </div>
      {text && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{text}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const today = isoDate(new Date());
      const now = new Date();
      const calls = [
        getAnnouncements(),
        getLeaves(),
        getAttendance({ date: today }),
      ];
      if (role !== 'EMPLOYEE') calls.push(getEmployees({ page: 1, limit: 1 }));
      if (role !== 'EMPLOYEE') calls.push(getPayrolls());
      if (role === 'ADMIN') calls.push(getAuditLogs());
      const res = await Promise.allSettled(calls);
      if (!alive) return;
      const leaves = toList(val(res[1], []), 'leaves');
      const att = toList(val(res[2], []), 'attendance');
      const empRes = role !== 'EMPLOYEE' ? val(res[3], null) : null;
      setData({
        announcements: toList(val(res[0], []), 'announcements'),
        leaves,
        pending: leaves.filter((l) => String(l.status).toUpperCase() === 'PENDING').length,
        attendance: att,
        present: att.filter((a) => a.checkIn).length,
        employees: empRes ? empRes.total ?? empRes.pagination?.total ?? toList(empRes, 'employees').length : 0,
        payrolls: role !== 'EMPLOYEE' ? toList(val(res[4], []), 'payrolls') : [],
        audits: role === 'ADMIN' ? toList(val(res[5], []), 'logs').length : 0,
        month: now.getMonth() + 1,
      });
    })();
    return () => { alive = false; };
  }, [role]);

  const name = user?.firstName || user?.name || 'there';
  if (!data) return <div className="flex justify-center py-20"><Spinner className="!h-8 !w-8" /></div>;

  const draft = data.payrolls.filter((p) => String(p.status).toUpperCase() === 'DRAFT').length;
  const myToday = data.attendance[0];
  const approved = data.leaves.filter((l) => String(l.status).toUpperCase() === 'APPROVED').length;

  return (
    <>
      <PageHeader title={`Welcome back, ${name}`} subtitle={`${role} dashboard · ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}`} />

      {role === 'ADMIN' && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Employees" value={data.employees} />
          <StatCard icon={CalendarClock} label="Pending leaves" value={data.pending} tone="amber" />
          <StatCard icon={Wallet} label="Payroll records" value={data.payrolls.length} tone="emerald" />
          <StatCard icon={ScrollText} label="Audit entries" value={data.audits} tone="rose" />
        </div>
      )}

      {role === 'HR' && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Employees" value={data.employees} />
          <StatCard icon={UserCheck} label="Checked in today" value={data.present} tone="emerald" />
          <StatCard icon={CalendarClock} label="Pending leaves" value={data.pending} tone="amber" />
          <StatCard icon={Wallet} label="Draft payrolls" value={draft} tone="rose" />
        </div>
      )}

      {role === 'EMPLOYEE' && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Clock} label="Today" value={myToday?.checkIn ? `In ${fmtTime(myToday.checkIn)}` : 'Not checked in'} tone="emerald" />
          <StatCard icon={CalendarClock} label="Pending requests" value={data.pending} tone="amber" />
          <StatCard icon={CalendarDays} label="Approved leaves" value={approved} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {role === 'ADMIN' && <AiInsights title="Company-wide AI insights" prompt="Give me company-wide insights: attendance trends, leave patterns, and payroll status." />}
        {role === 'HR' && <AiInsights title="HR AI summary" prompt="Summarise today's attendance and pending HR actions." />}
        {role === 'EMPLOYEE' && (
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">My recent leave requests</h2>
            {data.leaves.length === 0 ? <p className="text-sm text-slate-400">No leave requests yet.</p> : (
              <ul className="space-y-2">
                {data.leaves.slice(0, 5).map((l, i) => (
                  <li key={l.id ?? i} className="flex items-center justify-between text-sm">
                    <span>{l.leaveType} · {fmtDate(l.startDate)} → {fmtDate(l.endDate)}</span>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Announcements items={data.announcements} />
      </div>
    </>
  );
}
