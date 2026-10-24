import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Download, Lock, Cog } from 'lucide-react';
import { generatePayroll, finalizePayroll, getPayrolls, downloadPayslip } from '../api/payroll';
import { errMsg, toList } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, DataTable, StatusBadge, Modal } from '../components/ui.jsx';
import { MONTHS, money, empName, downloadBlob } from '../utils.js';

export default function Payroll() {
  const { role } = useAuth();
  const toast = useToast();
  const staff = role !== 'EMPLOYEE';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmFinal, setConfirmFinal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(toList(await getPayrolls(), 'payrolls')); } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(month, year); toast.success(msg); await load(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); setConfirmFinal(false); }
  };

  const payslip = async (r, mode) => {
    try {
      const blob = await downloadPayslip(r.id);
      const pdf = new Blob([blob], { type: 'application/pdf' });
      if (mode === 'view') window.open(URL.createObjectURL(pdf), '_blank', 'noopener');
      else downloadBlob(pdf, `payslip-${r.employeeCode || r.id}-${r.year}-${String(r.month).padStart(2, '0')}.pdf`);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const visible = rows.filter((r) => (!r.month || Number(r.month) === Number(month)) && (!r.year || Number(r.year) === Number(year)));
  const monthStatus = visible[0]?.status ? String(visible[0].status).toUpperCase() : null;
  const locked = visible.some((r) => String(r.status).toUpperCase() === 'FINALIZED');

  const columns = [
    ...(staff ? [{ key: 'emp', header: 'Employee', render: (r) => <span className="font-medium text-slate-900">{empName(r.employee || r.user) !== '—' ? empName(r.employee || r.user) : r.employeeName || '—'}</span> }] : []),
    { key: 'period', header: 'Period', render: (r) => `${MONTHS[(r.month || month) - 1]} ${r.year || year}` },
    { key: 'basicSalary', header: 'Basic', render: (r) => money(r.basicSalary ?? r.basic) },
    { key: 'deductions', header: 'Deductions', render: (r) => money(r.deductions ?? r.totalDeductions) },
    { key: 'netSalary', header: 'Net pay', render: (r) => <strong>{money(r.netSalary ?? r.netPay ?? r.net)}</strong> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'payslip', header: 'Payslip', render: (r) => (
      <div className="flex gap-1">
        <button className="btn-secondary !px-2 !py-1" onClick={() => payslip(r, 'view')} aria-label="View payslip"><FileText className="h-4 w-4" /></button>
        <button className="btn-secondary !px-2 !py-1" onClick={() => payslip(r, 'download')} aria-label="Download payslip"><Download className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title={staff ? 'Payroll' : 'My Payslips'} subtitle={staff ? 'Generate drafts and finalize the month' : 'View and download your payslips'} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input !w-40" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        <input type="number" className="input !w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        {monthStatus && <StatusBadge status={monthStatus} />}
        {staff && (
          <div className="ml-auto flex gap-2">
            <button className="btn-secondary" disabled={busy || locked} onClick={() => run(generatePayroll, 'Payroll draft generated')}><Cog className="h-4 w-4" /> Generate draft</button>
            {role === 'ADMIN' && <button className="btn-primary" disabled={busy || locked || visible.length === 0} onClick={() => setConfirmFinal(true)}><Lock className="h-4 w-4" /> Finalize month</button>}
          </div>
        )}
      </div>
      {locked && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">This month is finalized and locked.</p>}

      <DataTable columns={columns} rows={visible} loading={loading} empty="No payroll records for this period" />

      <Modal open={confirmFinal} onClose={() => setConfirmFinal(false)} title="Finalize payroll">
        <p className="text-sm text-slate-600">Finalizing <strong>{MONTHS[month - 1]} {year}</strong> locks the month permanently. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmFinal(false)}>Cancel</button>
          <button className="btn-danger" disabled={busy} onClick={() => run(finalizePayroll, 'Payroll finalized and locked')}>Finalize & lock</button>
        </div>
      </Modal>
    </>
  );
}
