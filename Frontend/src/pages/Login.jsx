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
        {/* Demo Accounts */}
        <div className="border-t border-slate-200 pt-5">
          <p className="mb-3 text-center text-sm font-semibold text-slate-700">
            Demo Accounts
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@gmail.com');
                setPassword('admin1234');
              }}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
            >
              Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('ali@company.com');
                setPassword('Temp@ali@company.com');
              }}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Employee
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('ayesha.hr@company.com');
                setPassword('Temp@ayesha.hr@company.com');
              }}
              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              HR
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            Select a demo account to autofill the login credentials.
          </p>
        </div>
      </form>
    </div>
  );
}
