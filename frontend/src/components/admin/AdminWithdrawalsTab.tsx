import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { WithdrawalRequest } from '../../types';

const AdminWithdrawalsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'complete';
    withdrawal: WithdrawalRequest | null;
  }>({ isOpen: false, type: 'approve', withdrawal: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [transferDate, setTransferDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', page, search, statusFilter],
    queryFn: () =>
      api
        .get(`/admin/withdrawals`, { params: { page, limit: 10, search, status: statusFilter } })
        .then((r) => r.data.data),
  });

  const withdrawals = (data?.withdrawals || []) as WithdrawalRequest[];
  const statusCounts = data?.statusCounts || [];
  const totalPages = data?.totalPages || 1;

  const actionMutation = useMutation({
    mutationFn: ({ id, type, payload }: { id: string; type: string; payload: any }) =>
      api.put(`/admin/withdrawals/${id}/${type}`, payload),
    onSuccess: (_, { type }) => {
      toast.success(`Withdrawal ${type}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || `Failed to ${actionModal.type} withdrawal`);
    },
  });

  const openActionModal = (type: 'approve' | 'reject' | 'complete', withdrawal: WithdrawalRequest) => {
    setActionModal({ isOpen: true, type, withdrawal });
    setAdminNotes('');
    setTransactionId('');
    setUtrNumber('');
    setTransferDate('');
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, type: 'approve', withdrawal: null });
    setAdminNotes('');
    setTransactionId('');
    setUtrNumber('');
    setTransferDate('');
  };

  const handleAction = () => {
    if (!actionModal.withdrawal) return;

    const payload: any = { notes: adminNotes };
    if (actionModal.type === 'complete') {
      if (!transactionId || !utrNumber || !transferDate) {
        toast.error('Please fill in all transaction details');
        return;
      }
      payload.transactionId = transactionId;
      payload.utrNumber = utrNumber;
      payload.transferDate = transferDate;
    }

    actionMutation.mutate({
      id: actionModal.withdrawal._id,
      type: actionModal.type,
      payload
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'approved': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusCount = (status: string) => {
    const stat = statusCounts.find((s: any) => s._id === status);
    return stat ? stat.count : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white">Withdrawal Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and process campaign creator withdrawals.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by campaign or creator name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#12182a] border border-white/[0.07] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-3 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-colors flex items-center gap-2 ${
                statusFilter === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#12182a] text-gray-400 border border-white/[0.07] hover:text-white'
              }`}
            >
              {status}
              {status !== 'all' && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === status ? 'bg-white/20' : 'bg-white/5'}`}>
                  {getStatusCount(status)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/[0.07]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-[#12182a]/50 border-b border-white/[0.07]">
              <tr>
                <th className="px-6 py-4 font-semibold">Creator & Campaign</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Bank Details</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No withdrawal requests found matching your criteria.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="mb-1">
                        <span className="font-semibold text-white">{w.creator?.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{w.creator?.email}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Campaign: <span className="text-violet-300">{w.campaign?.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        Requested: {new Date(w.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-white text-lg">₹{w.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white font-medium">{w.bankDetails.accountHolder}</p>
                      <p className="text-xs text-gray-400">Acct: <span className="font-mono text-gray-300">{w.bankDetails.accountNumber}</span></p>
                      <p className="text-xs text-gray-400">IFSC: <span className="font-mono text-gray-300">{w.bankDetails.ifsc}</span></p>
                      {w.bankDetails.bankName && <p className="text-xs text-gray-500">{w.bankDetails.bankName}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(w.status)}`}>
                        {w.status}
                      </span>
                      {w.reviewedBy && (
                        <p className="text-[10px] text-gray-500 mt-2">
                          Reviewed by: {w.reviewedBy.email}
                        </p>
                      )}
                      {w.completedAt && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-[10px] text-emerald-400 font-bold mb-1">
                            Completed: {new Date(w.completedAt).toLocaleDateString()}
                          </p>
                          {w.transactionDetails && (
                            <div className="text-[9px] text-gray-400 space-y-0.5">
                              <p>Txn ID: <span className="font-mono text-gray-300">{w.transactionDetails.transactionId}</span></p>
                              <p>UTR: <span className="font-mono text-gray-300">{w.transactionDetails.utrNumber}</span></p>
                              <p>Date: {new Date(w.transactionDetails.transferDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => openActionModal('approve', w)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 border border-blue-500/20 w-24"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal('reject', w)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 border border-red-500/20 w-24"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status === 'approved' && (
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => openActionModal('complete', w)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1 w-32"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Completed
                          </button>
                          <button
                            onClick={() => openActionModal('reject', w)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 border border-red-500/20 w-32 text-center"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-white/[0.07] text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-white/[0.07] text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.withdrawal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12182a] border border-white/[0.07] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 capitalize">{actionModal.type} Withdrawal</h3>
                
                {actionModal.type === 'approve' && (
                  <p className="text-sm text-gray-400 mb-4">
                    Approving this request means you verify the campaign has sufficient funds and the bank details look correct. You still need to perform the manual bank transfer and mark this as completed later.
                  </p>
                )}
                {actionModal.type === 'complete' && (
                  <p className="text-sm text-emerald-400 mb-4">
                    Confirm that the manual bank transfer of ₹{actionModal.withdrawal.amount.toLocaleString()} has been successfully processed to the creator's bank account.
                  </p>
                )}
                {actionModal.type === 'reject' && (
                  <p className="text-sm text-red-400 mb-4">
                    Rejecting this withdrawal will restore the funds (₹{actionModal.withdrawal.amount.toLocaleString()}) to the campaign's available balance.
                  </p>
                )}

                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Creator: <span className="text-white font-semibold">{actionModal.withdrawal.creator?.name}</span></p>
                  <p className="text-xs text-gray-400 mb-1">Amount: <span className="text-white font-bold text-base">₹{actionModal.withdrawal.amount.toLocaleString()}</span></p>
                </div>

                {actionModal.type === 'complete' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Transaction ID *</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full bg-[#0a0e1a] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="e.g. TXN123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">UTR Number *</label>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full bg-[#0a0e1a] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                        placeholder="e.g. UTR987654321"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Transfer Date *</label>
                      <input
                        type="date"
                        required
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full bg-[#0a0e1a] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Admin Notes (Optional)</label>
                  <textarea
                    className="w-full bg-[#0a0e1a] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    placeholder="Add an internal note..."
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl border border-white/[0.07] text-gray-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={actionMutation.isPending}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                      actionModal.type === 'approve' ? 'bg-blue-600 text-white hover:bg-blue-500' :
                      actionModal.type === 'reject' ? 'bg-red-600 text-white hover:bg-red-500' :
                      'bg-emerald-600 text-white hover:bg-emerald-500'
                    } disabled:opacity-50`}
                  >
                    {actionMutation.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Confirm {actionModal.type}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminWithdrawalsTab;
