import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Upload, Download, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getEmployees, registerEmployee, csvDryRun } from '../api/employee';
import { getSetup } from '../api/setup';
import { errMsg, toList } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, DataTable, Modal, Field, Badge, Spinner } from '../components/ui.jsx';
import { fmtDate, parseCsv, toCsv, downloadBlob } from '../utils.js';

const LIMIT = 10;
const CSV_COLS = ['employeeCode', 'firstName', 'lastName', 'email', 'phone', 'address', 'department', 'designation', 'joiningDate', 'basicSalary', 'role'];
const EMPTY = { employeeCode: '', firstName: '', lastName: '', email: '', phone: '', address: '', department: '', designation: '', joiningDate: '', basicSalary: '', role: 'EMPLOYEE' };

export default function Employees() {
  const { role } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [master, setMaster] = useState({ departments: [], designations: [] });

  const [regOpen, setRegOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvName, setCsvName] = useState('');
  const [dry, setDry] = useState(null); // { errors, validCount }
  const [csvBusy, setCsvBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getEmployees({ search: query, department, page, limit: LIMIT });
      const list = toList(d, 'employees');
      setRows(list);
      setTotal(d.total ?? d.pagination?.total ?? list.length);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, department, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getSetup().then((d) => { const s = d.setup || d; setMaster({ departments: s.departments || [], designations: s.designations || [] }); }).catch(() => {});
  }, []);

  const submitReg = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await registerEmployee({ ...form, basicSalary: Number(form.basicSalary), role: role === 'HR' ? 'EMPLOYEE' : form.role });
      toast.success('Employee registered');
      setRegOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = parseCsv(await file.text());
    setCsvName(file.name);
    setCsvRows(parsed);
    setDry(null);
    if (parsed.length === 0) toast.error('No data rows found in CSV');
  };

  const runDry = async () => {
    setCsvBusy(true);
    try {
      const res = await csvDryRun(csvRows);
      const errors = res.errors || res.invalid || res.invalidRows || [];
      setDry({ errors, validCount: res.validCount ?? res.valid ?? csvRows.length - errors.length });
      if (errors.length === 0) toast.success('Dry run passed — no errors');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setCsvBusy(false);
    }
  };

  // Only enabled after a clean dry run: registers each row through POST /employees
  const importRows = async () => {
    setCsvBusy(true);
    let ok = 0, failed = 0;
    for (const r of csvRows) {
      try { await registerEmployee({ ...r, basicSalary: Number(r.basicSalary) }); ok++; } catch { failed++; }
    }
    setCsvBusy(false);
    failed ? toast.error(`Imported ${ok}, ${failed} failed`) : toast.success(`Imported ${ok} employees`);
    closeCsv();
    load();
  };

  const closeCsv = () => { setCsvOpen(false); setCsvRows([]); setCsvName(''); setDry(null); if (fileRef.current) fileRef.current.value = ''; };

  const exportCsv = async () => {
    try {
      const d = await getEmployees({ search: query, department, page: 1, limit: 10000 });
      downloadBlob(new Blob([toCsv(toList(d, 'employees'), CSV_COLS)], { type: 'text/csv' }), 'employees.csv');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const downloadTemplate = () => downloadBlob(new Blob([CSV_COLS.join(',') + '\n'], { type: 'text/csv' }), 'employee-template.csv');
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const columns = [
    { key: 'employeeCode', header: 'Code' },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'joiningDate', header: 'Joined', render: (r) => fmtDate(r.joiningDate) },
    { key: 'role', header: 'Role', render: (r) => <Badge tone="indigo">{r.role || 'EMPLOYEE'}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Employee Directory" subtitle="Search, register, import and export employees"
        actions={<>
          <button className="btn-secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export</button>
          <button className="btn-secondary" onClick={() => setCsvOpen(true)}><Upload className="h-4 w-4" /> Import CSV</button>
          <button className="btn-primary" onClick={() => setRegOpen(true)}><Plus className="h-4 w-4" /> Register</button>
        </>} />

      <form className="mb-4 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search); }}>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input !pl-9" placeholder="Search name, email or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input !w-48" value={department} onChange={(e) => { setPage(1); setDepartment(e.target.value); }}>
          <option value="">All departments</option>
          {master.departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button className="btn-secondary">Search</button>
      </form>

      <DataTable columns={columns} rows={rows} loading={loading} page={page} limit={LIMIT} serverTotal={total} onPage={setPage} />

      <Modal open={regOpen} onClose={() => setRegOpen(false)} title="Register employee" wide>
        <form onSubmit={submitReg} className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee code"><input className="input" required value={form.employeeCode} onChange={f('employeeCode')} /></Field>
          <Field label="Email"><input type="email" className="input" required value={form.email} onChange={f('email')} /></Field>
          <Field label="First name"><input className="input" required value={form.firstName} onChange={f('firstName')} /></Field>
          <Field label="Last name"><input className="input" required value={form.lastName} onChange={f('lastName')} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={f('phone')} /></Field>
          <Field label="Joining date"><input type="date" className="input" required value={form.joiningDate} onChange={f('joiningDate')} /></Field>
          <Field label="Department">
            <select className="input" required value={form.department} onChange={f('department')}>
              <option value="">Select…</option>{master.departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Designation">
            <select className="input" required value={form.designation} onChange={f('designation')}>
              <option value="">Select…</option>{master.designations.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Basic salary"><input type="number" min="0" className="input" required value={form.basicSalary} onChange={f('basicSalary')} /></Field>
          <Field label="Role">
            <select className="input" value={role === 'HR' ? 'EMPLOYEE' : form.role} disabled={role === 'HR'} onChange={f('role')}>
              <option>EMPLOYEE</option><option>HR</option><option>ADMIN</option>
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Address"><textarea className="input" rows={2} value={form.address} onChange={f('address')} /></Field></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setRegOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Register'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={csvOpen} onClose={closeCsv} title="Import employees from CSV" wide>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Columns: <code className="text-xs">{CSV_COLS.join(', ')}</code>.{' '}
            <button className="text-indigo-600 underline" onClick={downloadTemplate}>Download template</button>
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-indigo-700" />
          {csvRows.length > 0 && <p className="text-sm text-slate-600"><strong>{csvName}</strong> — {csvRows.length} rows parsed</p>}

          {dry && dry.errors.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-rose-800"><AlertTriangle className="h-4 w-4" /> {dry.errors.length} error(s) found — fix the file and re-run the dry run</p>
              <div className="max-h-56 overflow-y-auto rounded bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-rose-100 text-left text-xs uppercase text-rose-700"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Field</th><th className="px-3 py-2">Problem</th></tr></thead>
                  <tbody className="divide-y divide-rose-100">
                    {dry.errors.map((er, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{er.row ?? er.rowNumber ?? er.line ?? i + 1}</td>
                        <td className="px-3 py-1.5">{er.field ?? er.column ?? '—'}</td>
                        <td className="px-3 py-1.5">{er.message ?? er.error ?? (typeof er === 'string' ? er : JSON.stringify(er))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {dry && dry.errors.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Dry run passed — {dry.validCount} rows are valid.</p>
          )}

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={closeCsv}>Close</button>
            <button className="btn-secondary" disabled={csvBusy || csvRows.length === 0} onClick={runDry}>{csvBusy ? <Spinner className="!h-4 !w-4" /> : 'Run dry run'}</button>
            <button className="btn-primary" disabled={csvBusy || !dry || dry.errors.length > 0} onClick={importRows}>Import {dry && dry.errors.length === 0 ? csvRows.length : ''} rows</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
