import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { donationService } from '../services/campaign.service';
import { Heart, Search, Calendar, ChevronRight } from 'lucide-react';

const DonorDashboardPage: React.FC = () => {
  // We keep 'my-donations' for the history list, but use 'my-stats' for exact aggregated metrics
  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => donationService.getDonationStats(),
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => donationService.getHistory(),
  });

  const donations = Array.isArray(historyData) ? historyData : historyData?.donations || historyData?.data || [];
  
  const stats = statsData?.stats || {
    totalDonated: 0,
    donationCount: 0,
    campaignsSupported: 0,
    avgDonation: 0
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-app max-w-4xl">
        <div className="mb-10">
          <h1 className="font-display font-black text-4xl text-white mb-2">My Impact</h1>
          <p className="text-gray-500">Track your donations and see the difference you've made.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass rounded-2xl p-6 md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Heart className="w-32 h-32 text-pink-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Impact Created</p>
            <p className="text-4xl font-black text-white mb-4">₹{stats.totalDonated.toLocaleString()}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-pink-400" /> {stats.campaignsSupported} campaigns supported</span>
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-violet-400" /> {stats.donationCount} total donations</span>
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-blue-400" /> ₹{stats.avgDonation.toLocaleString()} avg donation</span>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <Link to="/campaigns" className="w-16 h-16 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4 hover:bg-violet-600/30 transition-colors">
              <Search className="w-6 h-6" />
            </Link>
            <p className="text-sm font-semibold text-white">Find More Causes</p>
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-white mb-6">Donation History</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-24 shimmer" />)}
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">You haven't made any donations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation: any, i: number) => (
                <motion.div
                  key={donation._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:justify-between group hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={donation.campaign.images?.[0] || `https://placehold.co/100x100/1a1a2e/6C63FF?text=C`}
                      alt={donation.campaign.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <Link to={`/campaigns/${donation.campaign.slug}`} className="font-semibold text-white hover:text-violet-400 transition-colors line-clamp-1">
                        {donation.campaign.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(donation.createdAt).toLocaleDateString()}</span>
                        {donation.isAnonymous && <span className="badge-purple py-0 px-2 text-[10px]">Anonymous</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
                    <span className="font-bold text-white text-lg">₹{donation.amount.toLocaleString()}</span>
                    <Link to={`/campaigns/${donation.campaign.slug}`} className="text-gray-400 group-hover:text-violet-400">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboardPage;
