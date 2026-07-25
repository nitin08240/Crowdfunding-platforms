import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { campaignService, donationService } from '../services/campaign.service';
import { useAuth } from '../context/AuthContext';
import DonationModal from '../components/DonationModal';
import { Heart, Clock, Users, MapPin, Share2, AlertCircle, Eye, ShieldCheck, Zap, MessageCircle, FileText, Download, CheckCircle } from 'lucide-react';
import { CATEGORIES } from '../types';
import toast from 'react-hot-toast';

const DonationTicker: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [ticks, setTicks] = useState<Array<{ id: number; name: string; amount: number; time: Date }>>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const socket = io(apiUrl);
    socket.emit('join_campaign', campaignId);
    socket.on('new_donation', (data: any) => {
      const newTick = { id: Date.now(), name: data.isAnonymous ? 'Anonymous' : data.donorName, amount: data.amount, time: new Date() };
      setTicks((prev) => [newTick, ...prev].slice(0, 5));
    });
    return () => { socket.disconnect(); };
  }, [campaignId]);

  if (ticks.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {ticks.map((tick) => (
          <motion.div
            key={tick.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 glass rounded-xl px-4 py-3 ticker-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{tick.name}</p>
              <p className="text-xs text-gray-500">just donated</p>
            </div>
            <span className="text-sm font-bold text-violet-400 shrink-0">₹{tick.amount.toLocaleString()}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const CampaignDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'updates' | 'donors' | 'documents'>('story');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: () => campaignService.getBySlug(slug!),
    enabled: !!slug,
    // Re-fetch in the background every 30s for live stats
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const { data: donations } = useQuery({
    queryKey: ['campaign-donations', campaign?._id],
    queryFn: () => donationService.getCampaignDonations(campaign!._id),
    enabled: !!campaign?._id,
  });

  const { data: updates } = useQuery({
    queryKey: ['campaign-updates', campaign?._id],
    queryFn: () => campaignService.getUpdates(campaign!._id),
    enabled: !!campaign?._id,
  });

  /**
   * Called by DonationModal after payment is verified and React Query
   * caches are already invalidated. We just close the modal and show a toast.
   * The campaign query will refetch automatically due to invalidation in
   * DonationModal.invalidateAll().
   */
  const handleDonateSuccess = (_amount: number) => {
    setShowDonateModal(false);
    toast.success('Thank you for your donation! 🎉', { duration: 5000 });
    // Force immediate refetch of campaign + donors (DonationModal already
    // invalidated, but let's ensure they're in-flight right now)
    queryClient.refetchQueries({ queryKey: ['campaign', slug] });
    queryClient.refetchQueries({ queryKey: ['campaign-donations', campaign?._id] });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center glass p-10 rounded-2xl">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Campaign Not Found</h2>
        <p className="text-gray-500 mb-6">The campaign you're looking for doesn't exist or was removed.</p>
        <Link to="/campaigns" className="btn-primary">Browse Campaigns</Link>
      </div>
    </div>
  );

  // Use server-authoritative values directly from the query cache
  const raisedAmount = campaign.raisedAmount;
  const donorCount = campaign.donorCount;
  const percent = Math.min(Math.round((raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));
  const category = CATEGORIES.find((c) => c.value === campaign.category);
  const mainImage = campaign.images?.[0] || `https://placehold.co/1200x600/1a1a2e/a78bfa?text=${encodeURIComponent(campaign.title)}`;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden mb-6 relative group"
            >
              <img src={mainImage} alt={campaign.title} className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              {campaign.status !== 'active' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                  <span className={`badge ${campaign.status === 'pending_review' ? 'badge-yellow' : 'badge-red'} text-sm py-2 px-4 mb-2`}>
                    {campaign.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <p className="text-gray-300 text-sm">This campaign is not currently active.</p>
                </div>
              )}
            </motion.div>

            {/* Title & meta */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {category && <span className="badge-purple font-medium px-3 py-1.5">{category.emoji} {category.label}</span>}
                {campaign.location && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-white/5 px-3 py-1.5 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> {campaign.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-white/5 px-3 py-1.5 rounded-full">
                  <Eye className="w-3.5 h-3.5 text-gray-500" /> {campaign.viewCount} views
                </span>
              </div>

              <h1 className="font-display font-black text-3xl md:text-5xl text-white mb-4 leading-tight tracking-tight">
                {campaign.title}
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-8">{campaign.description}</p>

              {/* Creator Card */}
              <div className="flex items-center gap-4 glass rounded-2xl p-5 mb-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-bold text-white text-xl shrink-0 border-2 border-white/10">
                  {(campaign.creator as any)?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Campaign Organizer</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg text-white truncate">{(campaign.creator as any)?.name}</p>
                    {campaign.verified && (
                      <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                        <ShieldCheck className="w-3 h-3" /> Verified KYC
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-white/10 mb-6">
                {[
                  { id: 'story', label: 'Story' },
                  { id: 'updates', label: `Updates (${updates?.length || 0})` },
                  { id: 'donors', label: `Donors (${donations?.length || 0})` },
                  { id: 'documents', label: `Documents (${campaign.documents?.length || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 relative ${
                      activeTab === tab.id ? 'text-violet-400 border-violet-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-violet-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[300px]"
                >
                  {/* Story Tab */}
                  {activeTab === 'story' && (
                    <div className="glass rounded-3xl p-6 md:p-8">
                      <div className="prose prose-invert prose-violet max-w-none">
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">{campaign.story}</div>
                      </div>
                      {/* Tags */}
                      {campaign.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
                          {campaign.tags.map((tag) => (
                            <span key={tag} className="badge-blue px-3 py-1.5 text-xs font-medium">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Updates Tab */}
                  {activeTab === 'updates' && (
                    <div className="space-y-6">
                      {!updates || updates.length === 0 ? (
                        <div className="glass rounded-3xl p-10 text-center">
                          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No updates yet</p>
                          <p className="text-gray-600 text-sm mt-1">The creator hasn't posted any updates.</p>
                        </div>
                      ) : (
                        updates.map((update: any) => (
                          <div key={update._id} className="glass rounded-3xl p-6 md:p-8 relative">
                            <div className="absolute -left-3 top-8 w-6 h-6 bg-violet-500 rounded-full border-4 border-[#0a0e1a]" />
                            <p className="text-xs font-semibold text-violet-400 mb-2 uppercase tracking-wider">
                              {new Date(update.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <h3 className="text-xl font-bold text-white mb-3">{update.title}</h3>
                            <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{update.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Donors Tab */}
                  {activeTab === 'donors' && (
                    <div className="glass rounded-3xl p-6 md:p-8">
                      {!donations || donations.length === 0 ? (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 text-pink-500/30 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium mb-1">Be the first to donate</p>
                          <p className="text-gray-600 text-sm">Your contribution can inspire others.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {donations.map((d: any) => (
                            <div key={d._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-lg font-bold text-white shrink-0 border border-white/10">
                                  {d.isAnonymous ? '?' : d.donor?.name?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate text-lg">{d.isAnonymous ? 'Anonymous Donor' : d.donor?.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-pink-400 font-bold">₹{d.amount.toLocaleString()}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              {d.message && (
                                <div className="sm:w-1/2 bg-black/20 p-3 rounded-xl border border-white/5 relative">
                                  <div className="absolute top-4 -left-1.5 w-3 h-3 bg-black/20 border-t border-l border-white/5 rotate-45 hidden sm:block" />
                                  <p className="text-sm text-gray-300 italic">"{d.message}"</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents Tab */}
                  {activeTab === 'documents' && (
                    <div className="glass rounded-3xl p-6 md:p-8">
                      {!campaign.documents || campaign.documents.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium mb-1">No documents available</p>
                          <p className="text-gray-600 text-sm">The creator hasn't uploaded any supporting documents yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {campaign.documents.map((doc: any, index: number) => {
                            const labelDisplay = doc.label
                              .replace('_', ' ')
                              .split(' ')
                              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 border border-white/10">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-white text-lg mb-1">{labelDisplay}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Verified
                                      </div>
                                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                                      <span className="text-xs text-gray-500">
                                        {new Date(doc.uploadedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 shrink-0"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="hidden sm:inline">View</span>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-3xl p-6 md:p-8 shadow-2xl shadow-violet-900/20 border-violet-500/20 relative overflow-hidden"
              >
                {/* Glow effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Progress */}
                <div className="mb-6">
                  <p className="text-gray-400 text-sm font-medium mb-1">Amount Raised</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-black text-white tracking-tight">₹{raisedAmount.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm font-medium">of ₹{campaign.goalAmount.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar mb-3 h-3 bg-white/5">
                    <motion.div
                      className="progress-fill bg-gradient-to-r from-violet-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                  <p className="text-right text-sm font-bold text-violet-400">{percent}% Funded</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Donors</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{donorCount}</p>
                  </div>
                  <div className={`bg-white/5 rounded-2xl p-4 border ${daysLeft <= 7 ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${daysLeft <= 7 ? 'text-red-400' : 'text-gray-400'}`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Days Left</span>
                    </div>
                    <p className={`text-2xl font-bold ${daysLeft <= 7 ? 'text-red-400' : 'text-white'}`}>{daysLeft}</p>
                  </div>
                </div>

                {/* Donate button */}
                {campaign.status === 'active' && daysLeft > 0 ? (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) toast.error('Please login to donate');
                      else setShowDonateModal(true);
                    }}
                    className="w-full relative group overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 opacity-100 group-hover:opacity-80 transition-opacity duration-300"></span>
                    <div className="relative bg-gradient-to-br from-violet-600 to-pink-600 px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 transform group-hover:scale-[0.98]">
                      <Heart className="w-5 h-5 text-white" />
                      <span className="font-bold text-white text-lg">Donate Now</span>
                    </div>
                  </button>
                ) : campaign.status === 'completed' || daysLeft === 0 ? (
                  <div className="text-center py-6 bg-gradient-to-b from-green-500/20 to-transparent rounded-2xl border border-green-500/30">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-1">Campaign Completed 🎉</h3>
                    <p className="text-sm font-medium text-green-300">Thank you to everyone who supported!</p>
                  </div>
                ) : (
                  <div className="text-center py-5 bg-white/5 rounded-2xl border border-white/10">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-300">Campaign not accepting donations</p>
                  </div>
                )}

                <button
                  onClick={handleShare}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-semibold text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-200 border border-white/10"
                >
                  <Share2 className="w-4 h-4" /> Share with Friends
                </button>
              </motion.div>

              {/* Real-time ticker */}
              {campaign._id && (
                <div className="bg-gradient-to-b from-transparent to-black/20 rounded-3xl p-1">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Live Activity</p>
                  </div>
                  <DonationTicker campaignId={campaign._id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDonateModal && campaign && (
        <DonationModal
          campaign={campaign}
          onClose={() => setShowDonateModal(false)}
          onSuccess={handleDonateSuccess}
        />
      )}
    </div>
  );
};

export default CampaignDetailPage;
