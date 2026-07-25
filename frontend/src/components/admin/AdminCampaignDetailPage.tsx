import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  ArrowLeft, Eye, Check, X, Ban, Star, Trash2, ShieldCheck, 
  FileText, Download, ZoomIn, ZoomOut,
  Tag, MapPin, Heart, UserCheck, Mail, 
  Phone, AlertCircle, ExternalLink, Layers,
  CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_CONFIG, DOCUMENT_LABELS } from '../../types';

const AdminCampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Document preview state
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; label: string; name?: string } | null>(null);
  const [docZoom, setDocZoom] = useState(1);

  // Donation pagination state
  const [donationPage, setDonationPage] = useState(1);

  // Fetch campaign details
  const { data: campaignData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-campaign-detail', campaignId],
    queryFn: () => api.get(`/admin/campaigns/${campaignId}`).then((r) => r.data.data.campaign),
    enabled: !!campaignId,
  });

  // Fetch campaign donations
  const { data: donationsData, isLoading: isDonationsLoading } = useQuery({
    queryKey: ['admin-campaign-donations', campaignId, donationPage],
    queryFn: () => api.get(`/donations/campaign/${campaignId}?page=${donationPage}&limit=10`).then((r) => r.data.data),
    enabled: !!campaignId,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => api.put(`/admin/campaigns/${campaignId}/approve`),
    onSuccess: () => {
      toast.success('Campaign approved & marked active');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.put(`/admin/campaigns/${campaignId}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Campaign rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rejection failed'),
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => api.put(`/admin/campaigns/${campaignId}/suspend`, { reason }),
    onSuccess: () => {
      toast.success('Campaign suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Suspension failed'),
  });

  const featureMutation = useMutation({
    mutationFn: () => api.patch(`/admin/campaigns/${campaignId}/feature`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Feature status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/campaigns/${campaignId}`),
    onSuccess: () => {
      toast.success('Campaign deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      navigate('/admin/campaigns');
    },
  });

  const handleReject = () => {
    const reason = window.prompt('Enter rejection reason for creator:');
    if (reason && reason.trim()) rejectMutation.mutate(reason.trim());
  };

  const handleSuspend = () => {
    const reason = window.prompt('Enter suspension reason:');
    if (reason && reason.trim()) suspendMutation.mutate(reason.trim());
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this campaign? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (isError || !campaignData) {
    return (
      <div className="glass rounded-2xl p-12 text-center max-w-lg mx-auto my-12 border border-white/5">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Campaign Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">{(error as any)?.response?.data?.message || 'The requested campaign could not be found.'}</p>
        <button
          onClick={() => navigate('/admin/campaigns')}
          className="btn-primary py-2.5 px-6 text-sm font-semibold rounded-xl"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  const campaign = campaignData;
  const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const progress = Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100));
  const creator = campaign.creator || {};

  const getDocLabel = (labelKey: string) => {
    const found = DOCUMENT_LABELS.find((d) => d.value === labelKey);
    return found ? found.label : labelKey;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
            title="Back to Campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-black text-2xl text-white line-clamp-1">{campaign.title}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">ID: {campaign._id} • Created on {new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/campaigns/${campaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs border border-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Public View
          </a>

          <button
            onClick={() => featureMutation.mutate()}
            disabled={featureMutation.isPending}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border transition-colors ${
              campaign.flaggedForReview 
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30' 
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-yellow-500/10 hover:text-yellow-300'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            {campaign.flaggedForReview ? 'Featured' : 'Feature'}
          </button>

          {campaign.status === 'pending_review' && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 transition-colors"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {campaign.status === 'active' && (
            <button
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold text-xs hover:bg-orange-500/30 transition-colors"
            >
              <Ban className="w-4 h-4" /> Suspend
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Key Metrics Header Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Goal Amount</p>
              <p className="font-display font-black text-xl text-white">₹{campaign.goalAmount.toLocaleString()}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Raised Amount</p>
              <p className="font-display font-black text-xl text-emerald-400">₹{campaign.raisedAmount.toLocaleString()}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Available Balance</p>
              <p className="font-display font-black text-xl text-violet-400">₹{(campaign.availableBalance || 0).toLocaleString()}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Donors</p>
              <p className="font-display font-black text-xl text-white">{campaign.donorCount || 0}</p>
            </div>
          </div>

          {/* Progress Bar & Status Bar */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">Fundraising Progress</span>
              <span className="font-bold text-violet-400">{progress}% Funded</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>₹{campaign.raisedAmount.toLocaleString()} raised</span>
              <span>Target: ₹{campaign.goalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Short Description */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Short Description</h3>
            <p className="text-gray-200 text-base leading-relaxed">{campaign.description}</p>
          </div>

          {/* Full Story / Campaign Body */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Campaign Story & Details</h3>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {campaign.story}
            </div>
          </div>

          {/* Campaign Images Gallery */}
          {campaign.images && campaign.images.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" /> Media Gallery ({campaign.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {campaign.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group bg-white/5 border border-white/10">
                    <img src={img} alt={`Campaign Media ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-bold uppercase">
                        Cover Image
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {campaign.videoUrl && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-semibold">Video Link:</span>
                  <a href={campaign.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline truncate">
                    {campaign.videoUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Uploaded Documents Section */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" /> Verification Documents ({campaign.documents?.length || 0})
            </h3>
            {(!campaign.documents || campaign.documents.length === 0) ? (
              <p className="text-xs text-gray-500 italic">No verification documents uploaded for this campaign.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaign.documents.map((doc: any, idx: number) => {
                  const label = getDocLabel(doc.label);

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3 hover:border-violet-500/40 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => setSelectedDoc({ url: doc.url, label, name: doc.label })}
                            className="px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 text-[11px] font-semibold hover:bg-violet-500/30 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-2.5 py-1 rounded bg-white/5 text-gray-300 text-[11px] font-semibold hover:bg-white/10 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Donation History Table */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-violet-400" /> Donation History ({donationsData?.total || 0})
            </h3>
            {isDonationsLoading ? (
              <div className="py-6 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (!donationsData?.donations || donationsData.donations.length === 0) ? (
              <p className="text-xs text-gray-500 italic">No donations received for this campaign yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Donor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {donationsData.donations.map((don: any) => (
                      <tr key={don._id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{don.isAnonymous ? 'Anonymous' : (don.donor?.name || 'Anonymous')}</p>
                          {don.message && <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{don.message}"</p>}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">₹{don.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(don.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${don.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                            {don.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Donation Pagination */}
                {donationsData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
                    <span className="text-gray-500">Page {donationPage} of {donationsData.totalPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                        disabled={donationPage === 1}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setDonationPage((p) => Math.min(donationsData.totalPages, p + 1))}
                        disabled={donationPage === donationsData.totalPages}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column / Sidebar (1 col wide) */}
        <div className="space-y-8">
          
          {/* Creator Information Card */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider pb-3 border-b border-white/10 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-violet-400" /> Campaign Creator
            </h3>
            
            <div className="flex items-center gap-3">
              {creator.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-lg">
                  {creator.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="font-bold text-white text-base">{creator.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-400">{creator.role ? creator.role.toUpperCase() : 'USER'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">{creator.email || 'N/A'}</span>
              </div>
              {creator.phone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <span>{creator.phone}</span>
                </div>
              )}
              {creator.address && (
                <div className="flex items-start gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <span>{creator.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-gray-500">KYC Verification:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${creator.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {creator.kycStatus || 'none'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">User ID:</span>
                <span className="font-mono text-gray-400 text-[10px]">{creator._id || campaign.creator}</span>
              </div>
            </div>
          </div>

          {/* Campaign Metadata */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider pb-3 border-b border-white/10 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-400" /> Meta & Categorization
            </h3>

            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Category</span>
              <span className="font-semibold text-violet-300">{campaign.category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Deadline</span>
              <span className="font-semibold text-white">{new Date(campaign.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Location</span>
              <span className="font-semibold text-white">{campaign.location || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Slug</span>
              <span className="font-mono text-gray-400 text-[10px] truncate max-w-[150px]">{campaign.slug}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Page Views</span>
              <span className="font-semibold text-white">{campaign.viewCount || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-500">Shares</span>
              <span className="font-semibold text-white">{campaign.shareCount || 0}</span>
            </div>

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="pt-2">
                <p className="text-gray-500 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {campaign.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Approval History & Notes */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider pb-3 border-b border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" /> Approval Audit Log
            </h3>

            {campaign.approvedBy && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified & Approved</p>
                <p className="text-[10px] text-emerald-400/80">Approved by: {campaign.approvedBy.name || campaign.approvedBy.email || 'Admin'}</p>
                {campaign.approvedAt && (
                  <p className="text-[10px] text-emerald-400/80">Approved at: {new Date(campaign.approvedAt).toLocaleString()}</p>
                )}
              </div>
            )}

            {campaign.rejectedReason && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-1">
                <p className="font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejection Reason</p>
                <p className="text-xs text-red-200">{campaign.rejectedReason}</p>
              </div>
            )}

            {!campaign.approvedBy && !campaign.rejectedReason && (
              <p className="text-gray-500 italic">No formal review action recorded yet.</p>
            )}
          </div>

        </div>

      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-white text-base">{selectedDoc.label}</h3>
                <p className="text-xs text-gray-400 truncate max-w-md">{selectedDoc.url}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDocZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-400">{Math.round(docZoom * 100)}%</span>
                <button
                  onClick={() => setDocZoom((z) => Math.min(2.5, z + 0.25))}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-1 ml-2"
                >
                  <Download className="w-4 h-4" /> Download
                </a>

                <button
                  onClick={() => { setSelectedDoc(null); setDocZoom(1); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-auto bg-black/40 flex items-center justify-center min-h-[400px]">
              {selectedDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedDoc.url}
                  title={selectedDoc.label}
                  className="w-full h-[65vh] rounded-lg border border-white/10"
                />
              ) : (
                <div style={{ transform: `scale(${docZoom})`, transition: 'transform 0.2s ease-out' }}>
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.label}
                    className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignDetailPage;
