import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
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
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const fetchAdminProfile = useCallback(async () => {
    try {
      // Use Bearer token from localStorage (works cross-domain, unlike cookies)
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAdmin(null);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminProfile');
        return;
      }

      const { data } = await api.get('/admin-auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      // If /me fails, try using cached profile from localStorage
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
      const token = localStorage.getItem('adminToken');
      await api.post('/admin-auth/logout', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminAuthenticated: !!admin,
        isAdminLoading,
        adminLogout,
        refreshAdmin,
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
