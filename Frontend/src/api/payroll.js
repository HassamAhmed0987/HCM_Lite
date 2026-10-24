import client from './client';

// Points 14, 15, 16, 17
export const generatePayroll = (month, year) =>
  client.post('/payroll/generate', { month, year }).then((r) => r.data);

// Admin only - locks the month
export const finalizePayroll = (month, year) =>
  client.post('/payroll/finalize', { month, year }).then((r) => r.data);

export const getPayrolls = () => client.get('/payroll').then((r) => r.data);

// PDF view/download -> returns Blob
export const downloadPayslip = (id) =>
  client.get(`/payroll/${id}/payslip`, { responseType: 'blob' }).then((r) => r.data);
