import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  Search, CheckCircle2, XCircle, Trash2, Building2, Globe,
  Eye, FileText, Download, AlertCircle, X, ExternalLink,
  MapPin, CreditCard, UserCheck, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { NGOItem } from '../../types';
import { STATUS_CONFIG } from '../../types';

const AdminNGOsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedNGO, setSelectedNGO] = useState<NGOItem | null>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [viewDocsModal, setViewDocsModal] = useState(false);
  
  // Action Modals state
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [moreInfoModal, setMoreInfoModal] = useState(false);
  const [moreInfoNotes, setMoreInfoNotes] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ngos', page, searchQuery, statusFilter],
    queryFn: () => 
      api.get(`/admin/ngos?page=${page}&limit=10${searchQuery ? `&search=${searchQuery}` : ''}${statusFilter !== 'all' ? `&verificationStatus=${statusFilter}` : ''}`)
         .then((r) => r.data.data),
  });

  const ngos: NGOItem[] = data?.ngos || [];
  const totalPages = data?.totalPages || 1;
  const statusCounts = data?.statusCounts || [];

  const getStatusCount = (st: string) => {
    const found = statusCounts.find((item: any) => item._id === st);
    return found ? found.count : 0;
  };

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/ngos/${id}/verify`),
    onSuccess: () => {
      toast.success('NGO Verified and Approved Successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setViewDetailsModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.put(`/admin/ngos/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('NGO Application Rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setRejectModal(false);
      setRejectReason('');
      setViewDetailsModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  });

  const moreInfoMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.put(`/admin/ngos/${id}/request-info`, { notes }),
    onSuccess: () => {
      toast.success('Requested additional information from NGO.');
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] });
      setMoreInfoModal(false);
      setMoreInfoNotes('');
      setViewDetailsModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/ngos/${id}`),
    onSuccess: () => {
      toast.success('NGO deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this NGO application?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenDetails = (ngo: NGOItem) => {
    setSelectedNGO(ngo);
    setViewDetailsModal(true);
  };

  const handleOpenDocs = (ngo: NGOItem) => {
    setSelectedNGO(ngo);
    setViewDocsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & TOP SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white mb-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-400" /> NGO Management & Compliance
          </h1>
          <p className="text-gray-400 text-sm">Review 8-step applications, inspect documents, and manage non-profit verifications.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Name, Reg #, Email..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-9 py-2 text-sm w-full sm:w-72 bg-white/[0.03] border-white/10 focus:border-violet-500 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* FILTER TABS BADGES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Applications', count: data?.total || 0 },
          { id: 'pending', label: 'Pending Verification', count: getStatusCount('pending') },
          { id: 'verified', label: 'Approved (Verified)', count: getStatusCount('verified') },
          { id: 'more_info_required', label: 'Action Required', count: getStatusCount('more_info_required') },
          { id: 'rejected', label: 'Rejected', count: getStatusCount('rejected') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
              statusFilter === tab.id
                ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30'
                : 'bg-white/[0.03] text-gray-400 border-white/10 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Logo & NGO Name</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Registration Number</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Representative</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Submitted Date</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : ngos.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No NGO applications found for this filter.</td></tr>
              ) : (
                ngos.map((ngo) => {
                  const cfg = STATUS_CONFIG[ngo.verificationStatus] || STATUS_CONFIG.pending;
                  return (
                    <tr key={ngo._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ngo.documents?.logo || ngo.logo ? (
                            <img src={ngo.documents?.logo || ngo.logo} alt={ngo.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
                              {ngo.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white leading-tight">{ngo.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{ngo.contactDetails?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
                          {ngo.registrationNumber || 'N/A'}
                        </span>
                        <p className="text-[11px] text-gray-500 mt-1">{ngo.ngoType || 'Trust'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-200 text-xs">{ngo.representative?.fullName || ngo.creator?.name || 'N/A'}</p>
                        <p className="text-[11px] text-gray-500">{ngo.representative?.designation || 'Signatory'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(ngo.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(ngo)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="View Full 8-Step Application"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => handleOpenDocs(ngo)}
                            className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="View Uploaded Legal Documents"
                          >
                            <FileText className="w-3.5 h-3.5" /> Docs
                          </button>

                          {ngo.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => verifyMutation.mutate(ngo._id)}
                                disabled={verifyMutation.isPending}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Approve & Verify"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedNGO(ngo); setRejectModal(true); }}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Reject Application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDelete(ngo._id)}
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

      {/* MODAL 1: VIEW DETAILS MODAL */}
      {viewDetailsModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                {selectedNGO.documents?.logo || selectedNGO.logo ? (
                  <img src={selectedNGO.documents?.logo || selectedNGO.logo} alt={selectedNGO.name} className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-lg">
                    {selectedNGO.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">{selectedNGO.name}</h3>
                  <p className="text-xs text-gray-400">Reg: {selectedNGO.registrationNumber} • Type: {selectedNGO.ngoType}</p>
                </div>
              </div>
              <button onClick={() => setViewDetailsModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-300">
              {/* Step 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Organization Details
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li><strong className="text-gray-400">PAN:</strong> {selectedNGO.panNumber || 'N/A'}</li>
                    <li><strong className="text-gray-400">TAN:</strong> {selectedNGO.tanNumber || 'N/A'}</li>
                    <li><strong className="text-gray-400">GST:</strong> {selectedNGO.gstNumber || 'N/A'}</li>
                    <li><strong className="text-gray-400">DARPAN ID:</strong> {selectedNGO.darpanId || 'N/A'}</li>
                    <li><strong className="text-gray-400">12A Cert #:</strong> {selectedNGO.certificate12A || 'N/A'}</li>
                    <li><strong className="text-gray-400">80G Cert #:</strong> {selectedNGO.certificate80G || 'N/A'}</li>
                    <li><strong className="text-gray-400">Year Established:</strong> {selectedNGO.yearEstablished || 'N/A'}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Official Contact Details
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li><strong className="text-gray-400">Official Email:</strong> {selectedNGO.contactDetails?.email}</li>
                    <li><strong className="text-gray-400">Helpline Phone:</strong> {selectedNGO.contactDetails?.phone}</li>
                    <li><strong className="text-gray-400">Website:</strong> {selectedNGO.contactDetails?.website || 'N/A'}</li>
                    <li><strong className="text-gray-400">Facebook:</strong> {selectedNGO.socialMedia?.facebook || 'N/A'}</li>
                    <li><strong className="text-gray-400">Instagram:</strong> {selectedNGO.socialMedia?.instagram || 'N/A'}</li>
                  </ul>
                </div>
              </div>

              {/* Step 3: Address */}
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Registered Location
                </h4>
                <p className="text-xs text-gray-300">
                  {selectedNGO.location?.address}, {selectedNGO.location?.city}, {selectedNGO.location?.district}, {selectedNGO.location?.state} - {selectedNGO.location?.pincode}, {selectedNGO.location?.country}
                </p>
              </div>

              {/* Step 4: Mission & Vision */}
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Mission & Vision
                </h4>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Mission:</p>
                  <p className="text-xs text-gray-200 mt-0.5">{selectedNGO.mission}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Vision:</p>
                  <p className="text-xs text-gray-200 mt-0.5">{selectedNGO.vision}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">About NGO:</p>
                  <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">{selectedNGO.description}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Cause Categories:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedNGO.categories?.map((c) => (
                      <span key={c} className="px-2.5 py-0.5 rounded-full text-[11px] bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 5 & 7 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Bank Account Details
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li><strong className="text-gray-400">Account Holder:</strong> {selectedNGO.bankDetails?.accountHolderName}</li>
                    <li><strong className="text-gray-400">Bank Name:</strong> {selectedNGO.bankDetails?.bankName}</li>
                    <li><strong className="text-gray-400">Account Number:</strong> {selectedNGO.bankDetails?.accountNumber}</li>
                    <li><strong className="text-gray-400">IFSC Code:</strong> {selectedNGO.bankDetails?.ifscCode}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-violet-400 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Authorized Signatory
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li><strong className="text-gray-400">Name:</strong> {selectedNGO.representative?.fullName}</li>
                    <li><strong className="text-gray-400">Designation:</strong> {selectedNGO.representative?.designation}</li>
                    <li><strong className="text-gray-400">Email:</strong> {selectedNGO.representative?.email}</li>
                    <li><strong className="text-gray-400">Phone:</strong> {selectedNGO.representative?.phone}</li>
                    <li><strong className="text-gray-400">Aadhaar #:</strong> {selectedNGO.representative?.aadhaarNumber}</li>
                    <li><strong className="text-gray-400">PAN #:</strong> {selectedNGO.representative?.panNumber}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
              <button
                onClick={() => handleOpenDocs(selectedNGO)}
                className="px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold flex items-center gap-2 border border-violet-500/30"
              >
                <FileText className="w-4 h-4" /> Inspect Uploaded Documents
              </button>

              <div className="flex items-center gap-2">
                {selectedNGO.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => { setMoreInfoModal(true); }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30"
                    >
                      <AlertCircle className="w-4 h-4" /> Request Info
                    </button>
                    <button
                      onClick={() => { setRejectModal(true); }}
                      className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-500/30"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => verifyMutation.mutate(selectedNGO._id)}
                      disabled={verifyMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve NGO
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW DOCUMENTS MODAL */}
      {viewDocsModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-400" /> Uploaded Documents: {selectedNGO.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Click any document to preview or download high-resolution original file.</p>
              </div>
              <button onClick={() => setViewDocsModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(selectedNGO.documents || {}).map(([key, url]) => {
                if (!url) return null;
                const isPdf = url.toLowerCase().includes('.pdf');
                return (
                  <div key={key} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isPdf ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {isPdf ? 'PDF' : 'IMAGE'}
                        </span>
                      </div>
                    </div>

                    <div className="h-32 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative group">
                      {isPdf ? (
                        <div className="text-center p-4">
                          <FileText className="w-10 h-10 text-red-400 mx-auto" />
                          <p className="text-[11px] text-gray-400 mt-2">PDF Document</p>
                        </div>
                      ) : (
                        <img src={url} alt={key} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-violet-400" /> Preview
                      </a>
                      <a
                        href={url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-violet-500/30 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT MODAL */}
      {rejectModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Reject Application: {selectedNGO.name}
            </h3>
            <p className="text-xs text-gray-400">Please provide a clear rejection reason. An email notification will be automatically sent to {selectedNGO.contactDetails?.email}.</p>
            
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid 80G Certificate, PAN mismatch with registration deed..."
              className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRejectModal(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: selectedNGO._id, reason: rejectReason })}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REQUEST MORE INFO MODAL */}
      {moreInfoModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-amber-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Request Missing Documents / Info
            </h3>
            <p className="text-xs text-gray-400">Specify what missing documents or corrections are required. The applicant will be notified to update their form.</p>
            
            <textarea
              rows={4}
              value={moreInfoNotes}
              onChange={(e) => setMoreInfoNotes(e.target.value)}
              placeholder="e.g. Upload clear copy of 12A Certificate and update cancelled cheque..."
              className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setMoreInfoModal(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => moreInfoMutation.mutate({ id: selectedNGO._id, notes: moreInfoNotes })}
                disabled={moreInfoMutation.isPending || !moreInfoNotes.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNGOsTab;

