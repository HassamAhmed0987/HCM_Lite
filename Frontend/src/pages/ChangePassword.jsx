import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePassword } from '../api/auth';
import { errMsg } from '../api/client';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Field } from '../components/ui.jsx';

export default function ChangePassword() {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error('Password must be at least 8 characters');
    if (pw !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await changePassword(pw);
      toast.success('Password updated');
      setPw('');
      setConfirm('');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Change Password" subtitle="Choose a strong password you don't use elsewhere" />
      <form onSubmit={submit} className="card max-w-md space-y-4 p-6">
        <Field label="New password"><input type="password" className="input" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm new password"><input type="password" className="input" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        <button className="btn-primary" disabled={busy}><KeyRound className="h-4 w-4" /> {busy ? 'Updating…' : 'Update password'}</button>
      </form>
    </>
  );
}
