import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, MapPin, Globe, Mail, Phone, Heart, Users, LineChart, 
  Share2, CheckCircle2, ExternalLink, Building2
} from 'lucide-react';
import api from '../services/api';

const NGOProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNGO = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/ngos/${id}`);
        if (data.data) {
          setNgo(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch NGO details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNGO();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-white dark:bg-[#121212] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ngo) return <div className="min-h-screen pt-24 text-center text-text dark:text-white">NGO Not Found</div>;

  // Resolve logo & banner from documents or top-level fields
  const logoUrl = ngo.documents?.logo || ngo.logo || '';
  const bannerUrl = ngo.documents?.coverImage || ngo.banner || '';
  const websiteUrl = ngo.contactDetails?.website || '';
  const stats = ngo.stats || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-20 pb-20">
      {/* Hero Banner */}
      <div className="relative h-[300px] md:h-[400px] w-full bg-primary-900">
        {bannerUrl ? (
          <img src={bannerUrl} alt="NGO Banner" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-800 to-primary-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#121212] to-transparent" />
      </div>

      <div className="container-app relative -mt-32 z-10">
        <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[32px] p-6 md:p-10 shadow-xl shadow-black/5 flex flex-col md:flex-row gap-8 items-start mb-8">
          
          <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[24px] bg-primary-50 dark:bg-white/5 border-4 border-white dark:border-[#1a1a2e] flex items-center justify-center overflow-hidden shadow-lg -mt-16 md:-mt-20">
             {logoUrl ? (
              <img src={logoUrl} alt={ngo.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-5xl text-primary-600">{ngo.name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display font-black text-3xl md:text-4xl text-text dark:text-white mb-2 flex items-center gap-3">
                  {ngo.name}
                  {ngo.verificationStatus === 'verified' && (
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                  )}
                </h1>
                <p className="text-text-muted font-medium flex flex-wrap items-center gap-4 text-sm">
                  {ngo.location?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {ngo.location.city}, {ngo.location.state}</span>
                  )}
                  {ngo.ngoType && (
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {ngo.ngoType}</span>
                  )}
                </p>
                {/* Categories */}
                {ngo.categories && ngo.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ngo.categories.map((cat: string) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 text-xs font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-text dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <Link to={`/campaigns?ngo=${ngo._id}`} className="btn-primary rounded-full px-8 py-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" /> Donate Now
                </Link>
              </div>
            </div>
            <p className="text-[#555555] dark:text-gray-300 leading-relaxed text-lg max-w-4xl">
              {ngo.description}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: LineChart, label: 'Funds Raised', value: stats.fundsRaised ? `₹${(stats.fundsRaised / 100000).toFixed(1)} L` : '—' },
            { icon: Heart, label: 'Campaigns', value: stats.campaignCount ?? 0 },
            { icon: Users, label: 'Beneficiaries', value: stats.beneficiaryCount ? `${(stats.beneficiaryCount / 1000).toFixed(0)}k+` : '—' },
            { icon: CheckCircle2, label: 'Impact Score', value: stats.impactScore ? `${stats.impactScore}/100` : '—' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-6 text-center hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 mx-auto bg-primary-50 dark:bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center mb-3">
                <stat.icon className="w-6 h-6" />
              </div>
              <h4 className="font-display font-black text-2xl text-text dark:text-white mb-1">{stat.value}</h4>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Mission & Vision */}
            {(ngo.mission || ngo.vision) && (
              <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8">
                <h3 className="font-display font-bold text-2xl text-text dark:text-white mb-6">Mission & Vision</h3>
                <div className="grid gap-6">
                  {ngo.mission && (
                    <div className="p-6 rounded-[16px] bg-primary-50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/10">
                      <h4 className="font-bold text-primary-700 dark:text-primary-400 mb-2 uppercase text-xs tracking-wider">Our Mission</h4>
                      <p className="text-text dark:text-gray-300 italic">{ngo.mission}</p>
                    </div>
                  )}
                  {ngo.vision && (
                    <div className="p-6 rounded-[16px] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                      <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 uppercase text-xs tracking-wider">Our Vision</h4>
                      <p className="text-text dark:text-gray-300 italic">{ngo.vision}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {ngo.description && (
              <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8">
                <h3 className="font-display font-bold text-2xl text-text dark:text-white mb-4">About {ngo.name}</h3>
                <p className="text-[#555555] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{ngo.description}</p>
              </div>
            )}

            {/* Organization Details */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8">
              <h3 className="font-display font-bold text-2xl text-text dark:text-white mb-6">Organization Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Registration No.', value: ngo.registrationNumber },
                  { label: 'NGO Type', value: ngo.ngoType },
                  { label: 'Year Established', value: ngo.yearEstablished },
                  { label: 'PAN', value: ngo.panNumber },
                  { label: '12A Certificate', value: ngo.certificate12A ? '✅ Registered' : '—' },
                  { label: '80G Certificate', value: ngo.certificate80G ? '✅ Registered' : '—' },
                ].filter(d => d.value).map((detail, i) => (
                  <div key={i} className="flex justify-between items-center py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                    <span className="text-text-muted text-sm">{detail.label}</span>
                    <span className="font-bold text-text dark:text-white text-sm">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Verification Badge */}
            {ngo.verificationStatus === 'verified' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-[24px] p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-display font-bold text-lg text-green-800 dark:text-green-300 mb-1">Verified NGO</h4>
                <p className="text-green-600 dark:text-green-400 text-sm">This organization has been verified by CrowdFund.</p>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8">
              <h3 className="font-display font-bold text-xl text-text dark:text-white mb-6">Contact Info</h3>
              <div className="space-y-4">
                {ngo.contactDetails?.email && (
                  <a href={`mailto:${ngo.contactDetails.email}`} className="flex items-center gap-3 text-[#555555] dark:text-gray-300 hover:text-primary-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><Mail className="w-4 h-4" /></div>
                    <span className="truncate">{ngo.contactDetails.email}</span>
                  </a>
                )}
                {ngo.contactDetails?.phone && (
                  <a href={`tel:${ngo.contactDetails.phone}`} className="flex items-center gap-3 text-[#555555] dark:text-gray-300 hover:text-primary-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                    <span>{ngo.contactDetails.phone}</span>
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#555555] dark:text-gray-300 hover:text-primary-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><Globe className="w-4 h-4" /></div>
                    <span className="truncate">{websiteUrl}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                )}
                {ngo.location?.address && (
                  <div className="flex items-start gap-3 text-[#555555] dark:text-gray-300 pt-2 border-t border-[#EAEAEA] dark:border-white/10 mt-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                    <span className="text-sm mt-2">{ngo.location.address}, {ngo.location.city}, {ngo.location.state} — {ngo.location.pincode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {ngo.socialMedia && Object.values(ngo.socialMedia).some(Boolean) && (
              <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8">
                <h3 className="font-display font-bold text-xl text-text dark:text-white mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {ngo.socialMedia.facebook && (
                    <a href={ngo.socialMedia.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-lg hover:scale-110 transition-transform">
                      f
                    </a>
                  )}
                  {ngo.socialMedia.instagram && (
                    <a href={ngo.socialMedia.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-600 font-bold text-sm hover:scale-110 transition-transform">
                      IG
                    </a>
                  )}
                  {ngo.socialMedia.linkedin && (
                    <a href={ngo.socialMedia.linkedin} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold text-sm hover:scale-110 transition-transform">
                      in
                    </a>
                  )}
                </div>
              </div>
            )}

            <Link to="/campaigns" className="block w-full btn-secondary py-4 rounded-[16px] text-center">
              Explore All Campaigns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOProfilePage;
