import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Heart, FolderHeart, Clock, ArrowRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Campaign } from '../../types';

const StatCard = ({ icon: Icon, label, value, gradient, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass rounded-2xl p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </motion.div>
);

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  pending_review: <Clock className="w-4 h-4 text-yellow-400" />,
  rejected: <XCircle className="w-4 h-4 text-red-400" />,
};

const OverviewTab: React.FC = () => {
  const { user } = useAuth();

  const { data: campaignsData } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my').then((r) => r.data.data.campaigns as Campaign[]),
  });

  /**
   * Fetch aggregated donation stats from backend for precise values
   */
  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => api.get('/donations/me/stats').then((r) => r.data.data),
    staleTime: 10_000,
  });

  const campaigns = campaignsData ?? [];
  const totalRaised = campaigns.reduce((s, c) => s + c.raisedAmount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const pendingCount = campaigns.filter((c) => c.status === 'pending_review').length;

  const totalDonated = statsData?.stats?.totalDonated || 0;
  const recentDonations = statsData?.recentDonations || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl text-white mb-1">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm">Here's what's happening with your campaigns.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Raised" value={`₹${totalRaised.toLocaleString()}`} gradient="from-violet-600 to-purple-600" delay={0} />
        <StatCard icon={FolderHeart} label="Active Campaigns" value={activeCampaigns} gradient="from-blue-600 to-cyan-600" delay={0.05} />
        <StatCard icon={Heart} label="Total Donated" value={`₹${totalDonated.toLocaleString()}`} gradient="from-pink-600 to-rose-600" delay={0.1} />
        <StatCard icon={Clock} label="Pending Review" value={pendingCount} gradient="from-amber-600 to-orange-600" delay={0.15} />
      </div>

      {/* Recent Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-white">Recent Campaigns</h2>
          <Link to="/dashboard/campaigns" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <FolderHeart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-2">No campaigns yet</p>
            <p className="text-gray-600 text-sm mb-4">Create your first campaign to start fundraising.</p>
            <Link to="/create-campaign" className="btn-primary text-sm py-2.5 px-5">Start Fundraising</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 3).map((c) => {
              const pct = Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100));
              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {c.images[0] && (
                    <img src={c.images[0]} alt={c.title} className="w-full sm:w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon[c.status] || <AlertCircle className="w-4 h-4 text-gray-400" />}
                      <p className="font-semibold text-white text-sm truncate">{c.title}</p>
                    </div>
                    <div className="progress-bar mb-1">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>₹{c.raisedAmount.toLocaleString()} raised</span>
                      <span>{pct}% of ₹{c.goalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Donations */}
      {recentDonations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">Recent Donations</h2>
            <Link to="/dashboard/donate" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            {recentDonations.slice(0, 3).map((d: any, i: number) => (
              <div key={d._id} className={`flex items-center gap-4 px-5 py-4 ${i < 2 ? 'border-b border-white/[0.05]' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.campaign?.title}</p>
                  <p className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-violet-400">₹{d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
