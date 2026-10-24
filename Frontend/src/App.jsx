import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RoleGate } from './components/Guards.jsx';
import Layout from './components/Layout.jsx';
import { routeRoles } from './config/nav.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Setup from './pages/Setup.jsx';
import Employees from './pages/Employees.jsx';
import Attendance from './pages/Attendance.jsx';
import Leave from './pages/Leave.jsx';
import Payroll from './pages/Payroll.jsx';
import Announcements from './pages/Announcements.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

const guarded = (path, el) => <RoleGate roles={routeRoles(path)}>{el}</RoleGate>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="setup" element={guarded('/setup', <Setup />)} />
          <Route path="employees" element={guarded('/employees', <Employees />)} />
          <Route path="attendance" element={guarded('/attendance', <Attendance />)} />
          <Route path="leave" element={guarded('/leave', <Leave />)} />
          <Route path="payroll" element={guarded('/payroll', <Payroll />)} />
          <Route path="announcements" element={guarded('/announcements', <Announcements />)} />
          <Route path="audit-logs" element={guarded('/audit-logs', <AuditLogs />)} />
          <Route path="change-password" element={guarded('/change-password', <ChangePassword />)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
