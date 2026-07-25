import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, Ban, CheckCircle2, XCircle, Trash2, Shield, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [kycFilter, setKycFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchQuery, kycFilter],
    queryFn: () => 
      api.get(`/admin/users?page=${page}&limit=10${searchQuery ? `&search=${searchQuery}` : ''}${kycFilter !== 'all' ? `&kycStatus=${kycFilter}` : ''}`)
         .then((r) => r.data.data),
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }: { id: string, isSuspended: boolean }) => 
      api.patch(`/admin/users/${id}/suspend`, { isSuspended }),
    onSuccess: (_, variables) => {
      toast.success(variables.isSuspended ? 'User suspended' : 'User reactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const approveKYCMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/approve-kyc`),
    onSuccess: () => {
      toast.success('KYC Approved');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const rejectKYCMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => api.patch(`/admin/users/${id}/reject-kyc`, { reason }),
    onSuccess: () => {
      toast.success('KYC Rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleRejectKYC = (id: string) => {
    const reason = window.prompt('Enter reason for KYC rejection:');
    if (reason && reason.trim()) {
      rejectKYCMutation.mutate({ id, reason: reason.trim() });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white mb-1">User Management</h1>
          <p className="text-gray-500 text-sm">Manage registered users and KYC statuses</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-9 py-2 text-sm w-full sm:w-64 bg-white/[0.02] border-white/10 focus:border-violet-500"
            />
          </div>
          <select 
            value={kycFilter}
            onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm w-full sm:w-auto bg-white/[0.02] border-white/10 focus:border-violet-500"
          >
            <option value="all">All KYC Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">KYC Status</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found matching your criteria.</td></tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user._id} className={`hover:bg-white/[0.02] transition-colors ${user.isSuspended ? 'opacity-60 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white flex items-center gap-2">
                            {user.name}
                            {user.isSuspended && <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 font-bold uppercase tracking-wider">Suspended</span>}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.phone && <p className="text-xs text-gray-600 mt-0.5">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        user.kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        user.kycStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        user.kycStatus === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.kycStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => approveKYCMutation.mutate(user._id)}
                              disabled={approveKYCMutation.isPending}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Approve KYC"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectKYC(user._id)}
                              disabled={rejectKYCMutation.isPending}
                              className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                              title="Reject KYC"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => suspendMutation.mutate({ id: user._id, isSuspended: !user.isSuspended })}
                          disabled={suspendMutation.isPending || user.role === 'admin'}
                          className={`p-1.5 rounded-lg text-sm transition-colors ${
                            user.isSuspended 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                          title={user.isSuspended ? "Reactivate User" : "Suspend User"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={deleteMutation.isPending || user.role === 'admin'}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
