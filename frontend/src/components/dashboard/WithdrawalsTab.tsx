import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Banknote, Clock, ArrowDownCircle, AlertCircle
} from 'lucide-react';
import { withdrawalService } from '../../services/campaign.service';
import api from '../../services/api';
import type { Campaign, WithdrawalRequest } from '../../types';
import WithdrawModal from './WithdrawModal';

const WithdrawalsTab: React.FC = () => {
  const [withdrawCampaign, setWithdrawCampaign] = useState<Campaign | null>(null);

  // Fetch campaigns to calculate total balances
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then((r) => r.data.data.campaigns as Campaign[]),
  });

  // Fetch all withdrawals for the user
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => withdrawalService.getMine() as Promise<WithdrawalRequest[]>,
  });

  const isLoading = campaignsLoading || withdrawalsLoading;

  // Calculate aggregated stats
  const stats = useMemo(() => {
    let totalRaised = 0;
    let availableBalance = 0;
    let totalWithdrawn = 0;
    let pendingAmount = 0;
    let pendingCount = 0;

    campaigns.forEach((c) => {
      totalRaised += c.raisedAmount || 0;
      availableBalance += c.availableBalance || 0;
    });

    withdrawals.forEach((w) => {
      if (w.status === 'completed') {
        totalWithdrawn += w.amount || 0;
      } else if (w.status === 'pending' || w.status === 'approved') {
        pendingAmount += w.amount || 0;
        pendingCount += 1;
      }
    });

    return { totalRaised, availableBalance, totalWithdrawn, pendingAmount, pendingCount };
  }, [campaigns, withdrawals]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 shimmer h-28" />
          ))}
        </div>
        <div className="glass rounded-2xl p-5 shimmer h-64" />
      </div>
    );
  }

  // Find a campaign to withdraw from if the user clicks "Withdraw Funds" from the top button
  // For simplicity, we can ask them to select a campaign, or we can just direct them to My Campaigns tab
  // Or better, we can show a list of campaigns that have available balance.

  const eligibleCampaigns = campaigns.filter(c => c.availableBalance >= 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Withdrawals & Finances</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your campaign funds and track withdrawal requests.</p>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="glass rounded-2xl p-5 flex flex-col justify-between border-t border-violet-500/30"
        >
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Raised</span>
          </div>
          <p className="text-3xl font-black text-white">₹{stats.totalRaised.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 flex flex-col justify-between border-t border-emerald-500/30"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
          </div>
          <p className="text-3xl font-black text-white">₹{stats.availableBalance.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 flex flex-col justify-between border-t border-blue-500/30"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Withdrawn</span>
          </div>
          <p className="text-3xl font-black text-white">₹{stats.totalWithdrawn.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 flex flex-col justify-between border-t border-amber-500/30"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Pending Transfer</span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">₹{stats.pendingAmount.toLocaleString()}</p>
            {stats.pendingCount > 0 && (
              <p className="text-xs text-amber-500 mt-1">{stats.pendingCount} request(s) processing</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Withdraw Funds Section */}
      <div className="glass rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-bold text-lg text-white mb-2">Ready to withdraw?</h2>
            <p className="text-sm text-gray-400 max-w-xl">
              You can withdraw funds from campaigns that have a minimum available balance of ₹100. Select a campaign below to initiate a transfer to your bank account.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eligibleCampaigns.length === 0 ? (
            <div className="col-span-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-500 mb-3" />
              <p className="text-gray-400 text-sm">No campaigns have sufficient balance for withdrawal yet.</p>
            </div>
          ) : (
            eligibleCampaigns.map((c) => (
              <div key={c._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">Available: <strong className="text-emerald-400">₹{c.availableBalance.toLocaleString()}</strong></p>
                </div>
                <button
                  onClick={() => setWithdrawCampaign(c)}
                  className="w-full py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  <Banknote className="w-4 h-4" /> Withdraw
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal History */}
      <div>
        <h2 className="font-display font-bold text-lg text-white mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-white font-semibold mb-1">No withdrawals yet</p>
            <p className="text-sm text-gray-500">Your withdrawal requests will appear here once you initiate them.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-white/[0.02] border-b border-white/[0.05]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Campaign</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Bank Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {withdrawals.map((w) => {
                    const statusColors = {
                      pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      approved: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
                      completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    };
                    return (
                      <tr key={w._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(w.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="truncate text-white font-medium" title={w.campaign?.title}>{w.campaign?.title}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                          ₹{w.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-white">{w.bankDetails.accountHolder}</p>
                          <p className="text-xs text-gray-500">Acct: ****{w.bankDetails.accountNumber.slice(-4)}</p>
                          <p className="text-xs text-gray-500">IFSC: {w.bankDetails.ifsc}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[w.status]}`}>
                            {w.status}
                          </span>
                          {w.status === 'rejected' && w.adminNotes && (
                            <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={w.adminNotes}>
                              {w.adminNotes}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {withdrawCampaign && (
        <WithdrawModal
          campaign={{
            _id: withdrawCampaign._id,
            title: withdrawCampaign.title,
            availableBalance: withdrawCampaign.availableBalance,
          }}
          onClose={() => {
            setWithdrawCampaign(null);
            // We could invalidate queries here to refresh the list, but it's already handled inside WithdrawModal
          }}
        />
      )}
    </div>
  );
};

export default WithdrawalsTab;
