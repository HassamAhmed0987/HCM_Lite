import React from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-indigo-600 ${className}`} />;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className={`card max-h-[90vh] w-full overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const BADGE = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
export function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONE = {
  APPROVED: 'green', PRESENT: 'green', FINALIZED: 'green', ACTIVE: 'green',
  REJECTED: 'red', ABSENT: 'red',
  PENDING: 'amber', LATE: 'amber', HALF_DAY: 'amber', DRAFT: 'amber',
  LEAVE: 'indigo', ON_LEAVE: 'indigo',
};
export function StatusBadge({ status }) {
  const s = String(status || '—').toUpperCase();
  return <Badge tone={STATUS_TONE[s] || 'slate'}>{s.replace('_', ' ')}</Badge>;
}

export function StatCard({ icon: Icon, label, value, tone = 'indigo' }) {
  const tones = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-lg p-3 ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button className="btn-secondary !px-2 !py-1" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>Page {page} / {pages}</span>
        <button className="btn-secondary !px-2 !py-1" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * columns: [{ key, header, render?(row) }]
 * Client-side pagination when `serverTotal` is omitted; server-side when provided.
 */
export function DataTable({ columns, rows, loading, empty = 'No records found', page, limit = 10, onPage, serverTotal }) {
  const [localPage, setLocalPage] = React.useState(1);
  const server = serverTotal !== undefined;
  const cur = server ? page : localPage;
  const total = server ? serverTotal : rows.length;
  const visible = server ? rows : rows.slice((cur - 1) * limit, cur * limit);

  React.useEffect(() => {
    if (!server) setLocalPage(1);
  }, [rows.length, server]);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>{columns.map((c) => <th key={c.key} className="th">{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center"><Spinner className="mx-auto" /></td></tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                  <Inbox className="mx-auto mb-2 h-8 w-8" />{empty}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={row.id ?? row._id ?? i} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="td">{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={cur} limit={limit} total={total} onPage={server ? onPage : setLocalPage} />
    </div>
  );
}
