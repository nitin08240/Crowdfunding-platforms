import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PlusCircle, ExternalLink, Pause, Trash2, AlertCircle, Clock,
  CheckCircle2, XCircle, Users, Eye, Banknote, ArrowDownCircle,
  Wallet, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { withdrawalService } from '../../services/campaign.service';
import type { Campaign } from '../../types';
import { STATUS_CONFIG } from '../../types';
import WithdrawModal from './WithdrawModal';

const MyCampaignsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [withdrawCampaign, setWithdrawCampaign] = useState<Campaign | null>(null);
  const [expandedFinance, setExpandedFinance] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then((r) => r.data.data.campaigns as Campaign[]),
  });

  // Fetch withdrawal stats for the expanded campaign
  const { data: withdrawalData } = useQuery({
    queryKey: ['campaign-withdrawals', expandedFinance],
    queryFn: () => withdrawalService.getByCampaign(expandedFinance!),
    enabled: !!expandedFinance,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Campaign deleted');
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Failed to delete campaign'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/campaigns/${id}/status`, { status: 'paused' }),
    onSuccess: () => {
      toast.success('Campaign paused');
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 shimmer h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-white">My Campaigns</h1>
          <p className="text-gray-500 text-sm mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} created</p>
        </div>
        <Link to="/create-campaign" className="btn-primary text-sm py-2.5 px-5">
          <PlusCircle className="w-4 h-4" /> New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="font-display font-bold text-white text-lg mb-2">No campaigns yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Start your fundraising journey. Create a campaign and reach thousands of supporters.
          </p>
          <Link to="/create-campaign" className="btn-primary">Create Your First Campaign</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign, idx) => {
            const pct = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));
            const cfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;
            const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));
            const isFinanceOpen = expandedFinance === campaign._id;

            return (
              <motion.div
                key={campaign._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  {campaign.images[0] && (
                    <div className="w-full lg:w-48 h-40 lg:h-auto shrink-0 overflow-hidden">
                      <img src={campaign.images[0]} alt={campaign.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {campaign.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {campaign.status === 'pending_review' && <Clock className="w-3 h-3" />}
                        {campaign.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {cfg.label}
                      </span>
                      {campaign.verified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-white text-base mb-1 line-clamp-1">{campaign.title}</h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{campaign.description}</p>

                    {/* Rejection reason */}
                    {campaign.status === 'rejected' && campaign.rejectedReason && (
                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{campaign.rejectedReason}</p>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="progress-bar mb-1.5">
                        <div className="progress-fill transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-violet-400 font-bold">₹{campaign.raisedAmount.toLocaleString()} raised</span>
                        <span className="text-gray-500">{pct}% of ₹{campaign.goalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{campaign.donorCount} donors</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{campaign.viewCount} views</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{daysLeft} days left</span>
                      <span className="capitalize">{campaign.category}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {campaign.status === 'active' && (
                        <Link to={`/campaigns/${campaign.slug}`} className="btn-ghost text-xs py-1.5 px-3 gap-1">
                          <ExternalLink className="w-3 h-3" /> View Live
                        </Link>
                      )}
                      {campaign.status === 'active' && (
                        <button
                          onClick={() => pauseMutation.mutate(campaign._id)}
                          disabled={pauseMutation.isPending}
                          className="btn-ghost text-xs py-1.5 px-3 gap-1"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}

                      {/* Withdraw Funds button */}
                      {campaign.raisedAmount > 0 && (
                        <button
                          onClick={() => setExpandedFinance(isFinanceOpen ? null : campaign._id)}
                          className="btn-ghost text-xs py-1.5 px-3 gap-1 text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                        >
                          <Banknote className="w-3 h-3" /> Finances
                        </button>
                      )}

                      {deletingId === campaign._id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Are you sure?</span>
                          <button
                            onClick={() => deleteMutation.mutate(campaign._id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(campaign._id)}
                          className="btn-ghost text-xs py-1.5 px-3 gap-1 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Expandable Finance Panel ── */}
                <AnimatePresence>
                  {isFinanceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/[0.07]"
                    >
                      <div className="p-5 bg-white/[0.02]">
                        {/* Financial Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                          <div className="bg-violet-500/10 rounded-2xl p-4 border border-violet-500/20">
                            <div className="flex items-center gap-2 text-violet-400 mb-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Raised</span>
                            </div>
                            <p className="text-xl font-black text-white">₹{campaign.raisedAmount.toLocaleString()}</p>
                          </div>

                          <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
                              <Wallet className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
                            </div>
                            <p className="text-xl font-black text-white">
                              ₹{(withdrawalData?.stats?.availableBalance ?? campaign.availableBalance ?? 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
                            <div className="flex items-center gap-2 text-blue-400 mb-1.5">
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Withdrawn</span>
                            </div>
                            <p className="text-xl font-black text-white">
                              ₹{(withdrawalData?.stats?.totalWithdrawn ?? 0).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                            </div>
                            <p className="text-xl font-black text-white">
                              ₹{(withdrawalData?.stats?.pendingAmount ?? 0).toLocaleString()}
                            </p>
                            {(withdrawalData?.stats?.pendingCount ?? 0) > 0 && (
                              <p className="text-[10px] text-amber-400 mt-0.5 font-semibold">
                                {withdrawalData?.stats?.pendingCount} request{withdrawalData?.stats?.pendingCount !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Withdraw button */}
                        <button
                          onClick={() => setWithdrawCampaign(campaign)}
                          disabled={(withdrawalData?.stats?.availableBalance ?? campaign.availableBalance ?? 0) < 100}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Banknote className="w-4 h-4" />
                          Withdraw Funds
                        </button>
                        {(withdrawalData?.stats?.availableBalance ?? campaign.availableBalance ?? 0) < 100 && (
                          <p className="text-[11px] text-gray-500 text-center mt-2">Minimum withdrawal is ₹100</p>
                        )}

                        {/* Recent withdrawal history */}
                        {withdrawalData?.withdrawals && withdrawalData.withdrawals.length > 0 && (
                          <div className="mt-5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Withdrawal History</h4>
                            <div className="space-y-2">
                              {withdrawalData.withdrawals.slice(0, 5).map((w: any) => {
                                const statusColors: Record<string, string> = {
                                  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                  approved: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                                  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
                                  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                };
                                return (
                                  <div key={w._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                    <div>
                                      <p className="text-sm font-semibold text-white">₹{w.amount.toLocaleString()}</p>
                                      <p className="text-[11px] text-gray-500">
                                        {new Date(w.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusColors[w.status] || ''}`}>
                                      {w.status}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawCampaign && (
        <WithdrawModal
          campaign={{
            _id: withdrawCampaign._id,
            title: withdrawCampaign.title,
            availableBalance: withdrawalData?.stats?.availableBalance ?? withdrawCampaign.availableBalance ?? 0,
          }}
          onClose={() => setWithdrawCampaign(null)}
        />
      )}
    </div>
  );
};

export default MyCampaignsTab;
