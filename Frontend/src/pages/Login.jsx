import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errMsg } from '../api/client';
import { Field } from '../components/ui.jsx';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await login(email, password);
      toast.success('Signed in successfully');
      // Point 05: force password change on first login when flagged by the backend
      navigate(user?.mustChangePassword ? '/change-password' : '/', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-5 p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Building className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">HCM Lite</h1>
          <p className="text-sm text-slate-500">Sign in to your workspace</p>
        </div>
        <Field label="Email">
          <input className="input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in
        </button>
      </form>
    </div>
  );
}
