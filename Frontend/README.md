# HCM Lite — Frontend

React (Vite) + Tailwind CSS + Lucide Icons. Talks to the API at `http://localhost:3001/api`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## RBAC

`src/config/nav.js` is the single source of truth: it drives the sidebar and the route guards (`RoleGate`).

| Area | ADMIN | HR | EMPLOYEE |
|---|---|---|---|
| Company Setup / Master Data | yes | – | – |
| Employee Directory, CSV import (dry-run) / export | yes | yes | – |
| Attendance board + correction approvals | yes | yes | – |
| Web check-in/out, attendance calendar, correction requests | – | – | yes |
| Leave approvals | yes | yes | – |
| Leave apply + Smart Leave sentence | – | – | yes |
| Payroll generate draft | yes | yes | – |
| Payroll finalize (locks month) | yes | – | – |
| Payslip PDF view/download | yes | yes | yes |
| Announcements (read / post) | read+post | read+post | read |
| Audit logs | yes | – | – |
| Floating AI assistant | yes | yes | yes |

The UI hides what a role cannot use, but the backend must still enforce permissions.

## Assumptions about the backend (adjust if yours differs)

- List endpoints may return an array or `{ data | items | <key>: [] }`; `/employees` may also return `total`.
- `GET /attendance` accepts `date`, `month`+`year`, and `correctionStatus=PENDING`; a record may carry `correction: { id, status, reason }`.
- `GET /setup` is readable by HR (used for department/designation dropdowns).
- `leaveQuotas` is an object `{ ANNUAL, SICK, CASUAL }` (an array of `{ type, days }` is also accepted on read).
- CSV dry-run returns `{ errors: [{ row, field, message }], validCount }`. Import is enabled only after a clean dry run and uses `POST /employees` per row.
- Login user with `mustChangePassword: true` is redirected to Change Password.
- A 401 clears the session and returns to `/login`.
