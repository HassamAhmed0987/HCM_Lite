import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RoleGate({ roles, children }) {
  const { role } = useAuth();
  if (!roles.includes(role)) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
        <h2 className="mt-3 text-lg font-semibold text-slate-800">Access denied</h2>
        <p className="mt-1 text-sm text-slate-500">Your role ({role}) does not have permission to view this page.</p>
      </div>
    );
  }
  return children;
}
