import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000/api/v1';
const apiBaseUrl = rawApiUrl.replace(/\/+$/, '').endsWith('/api/v1')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      // If the request was for an admin endpoint
      if (original.url?.includes('/admin')) {
        // Do not retry or redirect if it's the admin auth check, just fail gracefully
        if (original.url.includes('/admin-auth/me')) {
          return Promise.reject(error);
        }
        
        // Otherwise, redirect to admin login if currently on an admin page (preventing infinite loops)
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        const { data } = await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
