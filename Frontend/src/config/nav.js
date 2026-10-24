import {
  LayoutDashboard, Building2, Users, Clock, CalendarDays, Wallet, Megaphone, ScrollText, KeyRound,
} from 'lucide-react';
import { ROLES } from '../context/AuthContext.jsx';

const { ADMIN, HR, EMPLOYEE } = ROLES;

// Single source of truth for RBAC: drives both the sidebar and the route guards.
export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ADMIN, HR, EMPLOYEE] },
  { to: '/setup', label: 'Company Setup', icon: Building2, roles: [ADMIN] },
  { to: '/employees', label: 'Employee Directory', icon: Users, roles: [ADMIN, HR] },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: [ADMIN, HR, EMPLOYEE] },
  { to: '/leave', label: 'Leave', icon: CalendarDays, roles: [ADMIN, HR, EMPLOYEE] },
  { to: '/payroll', label: 'Payroll', icon: Wallet, roles: [ADMIN, HR, EMPLOYEE] },
  { to: '/announcements', label: 'Announcements', icon: Megaphone, roles: [ADMIN, HR, EMPLOYEE] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [ADMIN] },
  { to: '/change-password', label: 'Change Password', icon: KeyRound, roles: [ADMIN, HR, EMPLOYEE] },
];

export const routeRoles = (path) => NAV.find((n) => n.to === path)?.roles;
