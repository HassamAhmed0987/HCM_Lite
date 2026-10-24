import client from './client';

// Points 09, 10, 11
export const checkIn = () => client.post('/attendance/check-in', { source: 'WEB' }).then((r) => r.data);
export const checkOut = () => client.post('/attendance/check-out').then((r) => r.data);
export const getAttendance = (params) => client.get('/attendance', { params }).then((r) => r.data);
export const requestCorrection = (data) => client.post('/attendance/correction', data).then((r) => r.data);
export const approveCorrection = (id, status) =>
  client.put(`/attendance/correction/${id}`, { status }).then((r) => r.data);
