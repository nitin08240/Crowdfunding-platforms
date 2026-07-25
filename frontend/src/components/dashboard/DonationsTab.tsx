import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart, ExternalLink, Search, Receipt, Copy, CheckCircle2,
  TrendingUp, BarChart2, Wallet, Clock,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { donationService } from '../../services/campaign.service';

/* ── Skeleton loader ── */
const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0">
    <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-48 bg-white/5 animate-pulse rounded" />
      <div className="h-2.5 w-24 bg-white/5 animate-pulse rounded" />
    </div>
    <div className="h-3 w-16 bg-white/5 animate-pulse rounded" />
  </div>
);

/* ── Stat card ── */
const StatCard = ({
  icon: Icon,
  value,
  label,
  gradient,
}: {
  icon: any;
  value: string | number;
  label: string;
  gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-2xl p-5 flex items-center gap-4"
  >
    <div
      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xl font-black text-white leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </motion.div>
);

/* ── Copy-to-clipboard helper ── */
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
      title="Copy transaction ID"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { label: string; className: string }> = {
    paid: { label: 'Success', className: 'bg-green-500/15 text-green-400 border border-green-500/25' },
    created: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' },
    failed: { label: 'Failed', className: 'bg-red-500/15 text-red-400 border border-red-500/25' },
    refunded: { label: 'Refunded', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' },
  };
  const { label, className } = cfg[status] ?? { label: status, className: 'bg-gray-500/20 text-gray-400 border border-gray-500/25' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
};

/* ── Main component ── */
const DonationsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [allDonations, setAllDonations] = useState<any[]>([]);

  const { data: responseDataObj, isLoading, isFetching } = useQuery({
    queryKey: ['my-donations', page],
    queryFn: () => donationService.getHistory(page, 10),
  });
  
  const responseData = responseDataObj as any;

  const { data: statsDataObj } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => donationService.getDonationStats(),
  });

  const statsData = statsDataObj as any;

  useEffect(() => {
    if (responseData?.donations) {
      setAllDonations(prev => {
        // Deduplicate using _id
        const newItems = responseData.donations.filter((d: any) => !prev.some((p: any) => p._id === d._id));
        return [...prev, ...newItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }
  }, [responseData]);

  const hasMore = responseData?.pagination ? responseData.pagination.page < responseData.pagination.pages : false;

  const handleDownloadReceipt = async (donationId: string, receiptNumber: string) => {
    try {
      const toastId = toast.loading('Generating receipt...');
      const response = await api.get(`/donations/${donationId}/receipt/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${receiptNumber || donationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const totalDonated = statsData?.stats?.totalDonated || 0;
  const avgDonation = statsData?.stats?.avgDonation || 0;
  const uniqueCampaigns = statsData?.stats?.campaignsSupported || 0;
  const totalCount = statsData?.stats?.donationCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl text-white">Donations Made</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your complete contribution history</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          value={`₹${totalDonated.toLocaleString()}`}
          label="Total Donated"
          gradient="from-violet-600 to-purple-600"
        />
        <StatCard
          icon={Heart}
          value={totalCount}
          label="Donations Made"
          gradient="from-pink-600 to-rose-600"
        />
        <StatCard
          icon={BarChart2}
          value={uniqueCampaigns}
          label="Campaigns Supported"
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          icon={TrendingUp}
          value={`₹${avgDonation.toLocaleString()}`}
          label="Avg Donation"
          gradient="from-amber-600 to-orange-600"
        />
      </div>

      {/* Donation list */}
      {isLoading && allDonations.length === 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : allDonations.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-14 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="font-display font-bold text-white text-lg mb-2">No donations yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Discover impactful campaigns and make a difference today.
          </p>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            <Search className="w-4 h-4" /> Explore Campaigns
          </Link>
        </motion.div>
      ) : (
        /* Donation cards */
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {allDonations.map((d, i) => (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="glass rounded-2xl p-4 group hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Campaign image + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {d.campaign?.images?.[0] ? (
                      <img
                        src={d.campaign.images[0]}
                        alt={d.campaign.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center shrink-0 border border-white/10">
                        <Heart className="w-6 h-6 text-violet-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/campaigns/${d.campaign?.slug}`}
                        className="font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1 block text-sm sm:text-base"
                      >
                        {d.campaign?.title ?? '—'}
                      </Link>
                      {d.campaign?.creator?.name && (
                        <p className="text-xs text-violet-400 mt-0.5">by {d.campaign.creator.name}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(d.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {(d as any).isAnonymous && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                            Anonymous
                          </span>
                        )}
                      </div>
                      {/* Transaction ID */}
                      {(d as any).razorpayPaymentId && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-600 font-mono">
                            {(d as any).razorpayPaymentId}
                          </span>
                          <CopyButton text={(d as any).razorpayPaymentId} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column: amount + badges + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 border-t sm:border-0 border-white/[0.06] pt-3 sm:pt-0 shrink-0">
                    <span className="font-black text-white text-xl">
                      ₹{d.amount.toLocaleString()}
                    </span>
                    <StatusBadge status={d.status} />
                    <div className="flex items-center gap-2 mt-1">
                      {(d as any).receiptNumber && (
                        <button
                          onClick={() => handleDownloadReceipt(d._id, (d as any).receiptNumber)}
                          className="px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/20 text-violet-300 hover:bg-violet-600/40 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Receipt
                        </button>
                      )}
                      {d.campaign?.slug && (
                        <Link
                          to={`/campaigns/${d.campaign.slug}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/15 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {(d as any).message && (
                  <p className="mt-3 pt-3 border-t border-white/[0.05] text-sm text-gray-400 italic line-clamp-2">
                    "{(d as any).message}"
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-6 text-center">
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={isFetching}
                className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {isFetching ? 'Loading...' : 'Load More Donations'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationsTab;
