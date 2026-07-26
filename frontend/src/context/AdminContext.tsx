import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'super_admin';
  profileImage?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

interface AdminContextType {
  admin: AdminProfile | null;
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  adminLogout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  /**
   * Call immediately after a successful login to populate admin state
   * synchronously from the login response — eliminates the race condition
   * where AdminRoute renders before the async /me fetch completes.
   */
  setAdminFromLogin: (profile: AdminProfile, token: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const fetchAdminProfile = useCallback(async () => {
    try {
      // Axios request interceptor now attaches adminToken for /admin routes automatically
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAdmin(null);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminProfile');
        return;
      }

      const { data } = await api.get('/admin-auth/me');
      if (data.success && data.data?.admin) {
        setAdmin(data.data.admin);
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminProfile', JSON.stringify(data.data.admin));
      } else {
        setAdmin(null);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminProfile');
        localStorage.removeItem('adminToken');
      }
    } catch {
      // If /me fails, fall back to cached profile in localStorage
      const cached = localStorage.getItem('adminProfile');
      const token = localStorage.getItem('adminToken');
      if (cached && token) {
        try {
          setAdmin(JSON.parse(cached));
        } catch {
          setAdmin(null);
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('adminProfile');
          localStorage.removeItem('adminToken');
        }
      } else {
        setAdmin(null);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminProfile');
        localStorage.removeItem('adminToken');
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsAdminLoading(true);
      await fetchAdminProfile();
      setIsAdminLoading(false);
    };
    init();
  }, [fetchAdminProfile]);

  const adminLogout = async () => {
    try {
      // Interceptor will attach adminToken automatically for /admin routes
      await api.post('/admin-auth/logout', {});
    } catch {
      // Ignore errors — still clear local state
    }
    setAdmin(null);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminProfile');
    localStorage.removeItem('adminToken');
  };

  const refreshAdmin = async () => {
    await fetchAdminProfile();
  };

  /**
   * Synchronously set admin state from the login API response.
   * Must be called BEFORE navigate() so that isAdminAuthenticated is already
   * true when AdminRoute evaluates — no race condition window.
   */
  const setAdminFromLogin = (profile: AdminProfile, token: string) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('adminProfile', JSON.stringify(profile));
    setAdmin(profile);
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        isAdminLoading,
        adminLogout,
        refreshAdmin,
        setAdminFromLogin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
