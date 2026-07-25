import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Eye, Check, X, Search, Trash2, Ban, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_CONFIG } from '../../types';

const AdminCampaignsTab: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns', page, searchQuery, statusFilter],
    queryFn: () => 
      api.get(`/admin/campaigns?page=${page}&limit=10${searchQuery ? `&search=${searchQuery}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`)
         .then((r) => r.data.data),
  });

  const campaigns = data?.campaigns || [];
  const totalPages = data?.totalPages || 1;

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/campaigns/${id}/approve`),
    onSuccess: () => {
      toast.success('Campaign approved');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => api.put(`/admin/campaigns/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Campaign rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
  });

  const featureMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/campaigns/${id}/feature`),
    onSuccess: (data) => {
      toast.success(data.data.message || 'Campaign feature status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => api.put(`/admin/campaigns/${id}/suspend`, { reason }),
    onSuccess: () => {
      toast.success('Campaign suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Campaign deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleReject = (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason && reason.trim()) {
      rejectMutation.mutate({ id, reason: reason.trim() });
    }
  };

  const handleSuspend = (id: string) => {
    const reason = window.prompt('Enter suspension reason:');
    if (reason && reason.trim()) {
      suspendMutation.mutate({ id, reason: reason.trim() });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Campaign Management</h1>
          <p className="text-gray-500 text-sm">Review, approve, and manage campaigns</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-9 py-2 text-sm w-full sm:w-64 bg-white/[0.02] border-white/10 focus:border-violet-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm w-full sm:w-auto bg-white/[0.02] border-white/10 focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Campaign Details</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Creator</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Goal / Raised</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No campaigns found.</td></tr>
              ) : (
                campaigns.map((campaign: any) => {
                  const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                  const progress = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));
                  
                  return (
                    <tr 
                      key={campaign._id} 
                      onClick={() => navigate(`/admin/campaigns/${campaign._id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/admin/campaigns/${campaign._id}`);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View campaign details for ${campaign.title}`}
                      className="hover:bg-white/[0.05] cursor-pointer transition-colors focus:outline-none focus:bg-white/[0.05]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          {campaign.flaggedForReview && (
                            <span title="Featured Campaign">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            </span>
                          )}
                          <p className="font-semibold text-white max-w-[200px] sm:max-w-[300px] truncate">{campaign.title}</p>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded">{campaign.category}</span>
                          {campaign.documents?.length > 0 && (
                            <span className="text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-bold">{campaign.documents.length} docs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {campaign.creator?.avatar ? (
                            <img src={campaign.creator.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-300 font-bold">
                              {campaign.creator?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-300">{campaign.creator?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500">{campaign.creator?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">₹{campaign.goalAmount.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">{progress}%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">₹{campaign.raisedAmount.toLocaleString()} raised</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/campaigns/${campaign._id}`);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="View Admin Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              featureMutation.mutate(campaign._id);
                            }}
                            disabled={featureMutation.isPending}
                            className={`p-1.5 rounded-lg transition-colors ${
                              campaign.flaggedForReview 
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                                : 'bg-white/5 text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                            }`}
                            title={campaign.flaggedForReview ? "Unfeature" : "Feature Campaign"}
                          >
                            <Star className="w-4 h-4" />
                          </button>

                          {campaign.status === 'pending_review' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveMutation.mutate(campaign._id);
                                }}
                                disabled={approveMutation.isPending}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(campaign._id);
                                }}
                                disabled={rejectMutation.isPending}
                                className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {campaign.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSuspend(campaign._id);
                              }}
                              disabled={suspendMutation.isPending}
                              className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                              title="Suspend Campaign"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(campaign._id);
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

export default AdminCampaignsTab;
