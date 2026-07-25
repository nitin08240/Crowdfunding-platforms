import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, Lock, Mail, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAdmin } from '../context/AdminContext';

const AdminAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAdmin } = useAdmin();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    secretKey: '',
  });

  const loginMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/admin-auth/login', data).then(r => r.data),
    onSuccess: async () => {
      // Refresh admin context so the cookie is validated and admin profile is loaded
      await refreshAdmin();
      toast.success('Admin access granted');
      navigate('/admin');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Authentication failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container-app relative z-10 w-full max-w-md">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to main site
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl border-red-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display font-black text-2xl text-white mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-sm text-gray-400">Secure access requires 3-factor authentication</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-12 py-3 bg-black/40 border-white/10 focus:border-red-500/50"
                  placeholder="admin@platform.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-12 py-3 bg-black/40 border-white/10 focus:border-red-500/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Secret Key</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.secretKey}
                  onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                  className="input pl-12 py-3 bg-black/40 border-white/10 focus:border-red-500/50"
                  placeholder="Admin Secret Key"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-6"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-80 group-hover:opacity-100 transition-opacity"></span>
              <div className="relative bg-black/50 px-8 py-3 rounded-xl flex items-center justify-center gap-2 backdrop-blur-md">
                {loginMutation.isPending ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5 text-red-400" />
                    <span className="font-bold text-white">Authenticate</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;
