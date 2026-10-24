import client from './client';

// Points 23, 25
export const getAnnouncements = () => client.get('/announcements').then((r) => r.data);

// HR/Admin: { title, content, targetDepartment }
export const createAnnouncement = (data) => client.post('/announcements', data).then((r) => r.data);

// Admin only
export const getAuditLogs = () => client.get('/audit-logs').then((r) => r.data);
