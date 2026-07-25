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
      const { data } = await api.get('/admin-auth/me');
      if (data.success && data.data?.admin) {
        setAdmin(data.data.admin);
        // Keep localStorage flag as secondary indicator for quick checks
        localStorage.setItem('isAdmin', 'true');
      } else {
        setAdmin(null);
        localStorage.removeItem('isAdmin');
      }
    } catch {
      setAdmin(null);
      localStorage.removeItem('isAdmin');
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
      await api.post('/admin-auth/logout');
    } catch {
      // Ignore errors — still clear local state
    }
    setAdmin(null);
    localStorage.removeItem('isAdmin');
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
