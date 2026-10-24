import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../api/m9';
import { errMsg, toList } from '../api/client';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, DataTable, Badge } from '../components/ui.jsx';
import { fmtDateTime, empName } from '../utils.js';

export default function AuditLogs() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    getAuditLogs()
      .then((d) => setRows(toList(d, 'logs')))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : v ?? '—');
  const visible = rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));

  const columns = [
    { key: 'createdAt', header: 'When', render: (r) => fmtDateTime(r.createdAt || r.timestamp) },
    { key: 'user', header: 'User', render: (r) => (r.user ? empName(r.user) : r.userEmail || r.actor || '—') },
    { key: 'action', header: 'Action', render: (r) => <Badge tone="indigo">{r.action || '—'}</Badge> },
    { key: 'entity', header: 'Entity', render: (r) => r.entity || r.resource || '—' },
    { key: 'details', header: 'Details', render: (r) => <span className="line-clamp-2 max-w-md break-all text-xs text-slate-500">{text(r.details ?? r.description ?? r.meta)}</span> },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Immutable record of sensitive actions across the company"
        actions={<input className="input !w-64" placeholder="Filter logs…" value={q} onChange={(e) => setQ(e.target.value)} />} />
      <DataTable columns={columns} rows={visible} loading={loading} empty="No audit entries" />
    </>
  );
}
