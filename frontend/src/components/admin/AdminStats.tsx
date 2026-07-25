import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, FolderHeart, Heart, Building2, TrendingUp, AlertCircle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStats: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  if (statsLoading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="glass rounded-2xl p-5 shimmer h-32" />)}
        </div>
      </div>
    );
  }

  const s = statsData;
  const d = dashboardData;

  const statGroups = [
    {
      title: 'Users Overview',
      cards: [
        { label: 'Total Users', value: s?.users?.total || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { label: 'Today\'s Registrations', value: s?.users?.todayRegistrations || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
        { label: 'Verified KYC', value: s?.users?.kycVerified || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        { label: 'Pending KYC', value: s?.users?.kycPending || 0, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      ]
    },
    {
      title: 'Campaigns Overview',
      cards: [
        { label: 'Total Campaigns', value: s?.campaigns?.total || 0, icon: FolderHeart, color: 'text-violet-400', bg: 'bg-violet-500/20' },
        { label: 'Active', value: s?.campaigns?.active || 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20' },
        { label: 'Pending Review', value: s?.campaigns?.pending || 0, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        { label: 'Rejected', value: s?.campaigns?.rejected || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      ]
    },
    {
      title: 'Donations & Revenue',
      cards: [
        { label: 'Total Amount', value: `₹${(s?.donations?.totalAmount || 0).toLocaleString()}`, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
        { label: 'Today\'s Amount', value: `₹${(s?.donations?.todayAmount || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        { label: 'Monthly Amount', value: `₹${(s?.donations?.monthlyAmount || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { label: 'Total Count', value: s?.donations?.count || 0, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/20' },
      ]
    },
    {
      title: 'NGOs Overview',
      cards: [
        { label: 'Total NGOs', value: s?.ngos?.total || 0, icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
        { label: 'Verified', value: s?.ngos?.verified || 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20' },
        { label: 'Pending', value: s?.ngos?.pending || 0, icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        { label: 'Rejected', value: s?.ngos?.rejected || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl text-white mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Real-time platform statistics and recent activity</p>
      </div>

      <div className="space-y-8">
        {statGroups.map((group, groupIdx) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-lg font-semibold text-white/90">{group.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.cards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (groupIdx * 4 + i) * 0.05 }}
                  className="glass rounded-2xl p-6 flex items-center gap-4 border border-white/5"
                >
                  <div className={`w-14 h-14 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-7 h-7 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white truncate">{card.value}</p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{card.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* Latest Campaigns */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-violet-400" /> Recent Campaigns
          </h3>
          <div className="space-y-4">
            {d?.latestCampaigns?.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5">
                <div>
                  <p className="font-medium text-white text-sm max-w-[200px] truncate">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {c.creator?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">₹{c.goalAmount?.toLocaleString()}</p>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                    c.status === 'active' ? 'text-green-400' :
                    c.status === 'pending_review' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Donations */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" /> Recent Donations
          </h3>
          <div className="space-y-4">
            {d?.latestDonations?.map((don: any) => (
              <div key={don._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5">
                <div>
                  <p className="font-medium text-white text-sm">{don.donor?.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{don.campaign?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-pink-400">₹{don.amount?.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{new Date(don.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending KYC Users */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" /> Pending KYC Reviews
          </h3>
          <div className="space-y-4">
            {d?.pendingKYC?.length > 0 ? d.pendingKYC.map((u: any) => (
              <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5">
                <div>
                  <p className="font-medium text-white text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                </div>
                <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] uppercase font-semibold">
                  Needs Review
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 italic">No pending KYC reviews.</p>
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" /> Recent Admin Activity
          </h3>
          <div className="space-y-4">
            {d?.auditLogs?.map((log: any) => (
              <div key={log._id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">
                    {log.adminId?.name || 'System'} <span className="text-gray-400 font-normal">performed</span> <span className="text-violet-400">{log.action}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
