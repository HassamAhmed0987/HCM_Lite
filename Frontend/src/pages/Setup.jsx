import React, { useEffect, useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { getSetup, updateSetup } from '../api/setup';
import { errMsg } from '../api/client';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Field, Spinner } from '../components/ui.jsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LEAVE_TYPES = ['ANNUAL', 'SICK', 'CASUAL'];

function TagEditor({ label, items, onChange, placeholder }) {
  const [v, setV] = useState('');
  const add = () => {
    const t = v.trim();
    if (t && !items.includes(t)) onChange([...items, t]);
    setV('');
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
            {i}
            <button type="button" onClick={() => onChange(items.filter((x) => x !== i))} aria-label={`Remove ${i}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm text-slate-400">None yet</span>}
      </div>
      <div className="flex gap-2">
        <input className="input" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn-secondary" onClick={add}><Plus className="h-4 w-4" /> Add</button>
      </div>
    </div>
  );
}

const normQuotas = (q) => {
  const out = { ANNUAL: 0, SICK: 0, CASUAL: 0 };
  if (Array.isArray(q)) q.forEach((x) => { out[String(x.type || x.leaveType).toUpperCase()] = Number(x.days ?? x.quota ?? 0); });
  else if (q) LEAVE_TYPES.forEach((t) => { out[t] = Number(q[t] ?? q[t.toLowerCase()] ?? 0); });
  return out;
};

export default function Setup() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    companyName: '', officeStart: '09:00', graceTimeMinutes: 15, halfDayHours: 4,
    weekendDays: ['Saturday', 'Sunday'], departments: [], designations: [],
    leaveQuotas: { ANNUAL: 0, SICK: 0, CASUAL: 0 },
  });

  useEffect(() => {
    getSetup()
      .then((d) => {
        const s = d.setup || d;
        setF((p) => ({ ...p, ...s, leaveQuotas: normQuotas(s.leaveQuotas), departments: s.departments || [], designations: s.designations || [], weekendDays: s.weekendDays || p.weekendDays }));
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSetup({
        companyName: f.companyName,
        officeStart: f.officeStart,
        graceTimeMinutes: Number(f.graceTimeMinutes),
        halfDayHours: Number(f.halfDayHours),
        weekendDays: f.weekendDays,
        departments: f.departments,
        designations: f.designations,
        leaveQuotas: f.leaveQuotas,
      });
      toast.success('Company setup saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="!h-8 !w-8" /></div>;

  return (
    <form onSubmit={save}>
      <PageHeader title="Company Setup" subtitle="Company profile, attendance rules and master data"
        actions={<button className="btn-primary" disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold text-slate-900">Company & attendance rules</h2>
          <Field label="Company name"><input className="input" required value={f.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Office start"><input type="time" className="input" value={f.officeStart} onChange={(e) => set('officeStart', e.target.value)} /></Field>
            <Field label="Grace (min)"><input type="number" min="0" className="input" value={f.graceTimeMinutes} onChange={(e) => set('graceTimeMinutes', e.target.value)} /></Field>
            <Field label="Half-day (hrs)"><input type="number" min="0" step="0.5" className="input" value={f.halfDayHours} onChange={(e) => set('halfDayHours', e.target.value)} /></Field>
          </div>
          <div>
            <span className="label">Weekend days</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const on = f.weekendDays.includes(d);
                return (
                  <button key={d} type="button" onClick={() => set('weekendDays', on ? f.weekendDays.filter((x) => x !== d) : [...f.weekendDays, d])}
                    className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-semibold text-slate-900">Annual leave quotas (days)</h2>
          <div className="grid grid-cols-3 gap-3">
            {LEAVE_TYPES.map((t) => (
              <Field key={t} label={t}>
                <input type="number" min="0" className="input" value={f.leaveQuotas[t]}
                  onChange={(e) => set('leaveQuotas', { ...f.leaveQuotas, [t]: Number(e.target.value) })} />
              </Field>
            ))}
          </div>
        </section>

        <section className="card p-5"><TagEditor label="Departments" items={f.departments} onChange={(v) => set('departments', v)} placeholder="e.g. Engineering" /></section>
        <section className="card p-5"><TagEditor label="Designations" items={f.designations} onChange={(v) => set('designations', v)} placeholder="e.g. Senior Developer" /></section>
      </div>
    </form>
  );
}
