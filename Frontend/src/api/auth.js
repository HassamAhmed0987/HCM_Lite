import client from './client';

// Point 02: login -> { token, role, user }
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

// Point 05: forced / voluntary password change
export const changePassword = (newPassword) =>
  client.post('/auth/change-password', { newPassword }).then((r) => r.data);
