import client from './client';

// Points 12, 13, 21
// { leaveType: "ANNUAL|SICK|CASUAL", startDate, endDate, reason }
export const applyLeave = (data) => client.post('/leave', data).then((r) => r.data);
export const getLeaves = () => client.get('/leave').then((r) => r.data);

// HR/Admin: { status: "APPROVED|REJECTED", comment }
export const updateLeaveStatus = (id, status, comment) =>
  client.put(`/leave/${id}/status`, { status, comment }).then((r) => r.data);
