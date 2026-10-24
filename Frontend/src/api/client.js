import axios from 'axios';

export const TOKEN_KEY = 'hcm_token';
export const USER_KEY = 'hcm_user';

const client = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Something went wrong';

/** Normalise list responses: array | {data|items|rows|<key>: []} */
export const toList = (d, key) => {
  if (Array.isArray(d)) return d;
  if (!d) return [];
  return d[key] || d.data || d.items || d.rows || [];
};

export default client;
