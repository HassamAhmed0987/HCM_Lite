import client from './client';

// Points 01, 03, 04
export const getSetup = () => client.get('/setup').then((r) => r.data);

// Admin only
// { companyName, officeStart, graceTimeMinutes, halfDayHours, weekendDays, departments, designations, leaveQuotas }
export const updateSetup = (data) => client.put('/setup', data).then((r) => r.data);
