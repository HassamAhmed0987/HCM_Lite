import client from './client';

// Points 05, 06, 07, 08, 14
// { employeeCode, firstName, lastName, email, phone, address, department, designation, joiningDate, basicSalary, role }
export const registerEmployee = (data) => client.post('/employees', data).then((r) => r.data);

// GET /employees?search=&department=&page=&limit=
export const getEmployees = (params) => client.get('/employees', { params }).then((r) => r.data);

// { rows: [...] }
export const csvDryRun = (rows) => client.post('/employees/csv-dry-run', { rows }).then((r) => r.data);
