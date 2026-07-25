import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { campaignService } from '../services/campaign.service';
import CampaignCard from '../components/CampaignCard';
import Footer from '../components/Footer';
import { CATEGORIES } from '../types';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-raisedAmount', label: 'Most Funded' },
  { value: 'deadline', label: 'Ending Soon' },
  { value: '-donorCount', label: 'Most Popular' },
];

const CampaignsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', category, sort, debouncedSearch],
    queryFn: () => campaignService.getAll({ category, sort, search: debouncedSearch, status: 'active', limit: 12 }),
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-app">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-end mb-10">
          <div>
            <p className="text-primary-700 text-sm font-extrabold mb-2 uppercase tracking-wider">Explore Campaigns</p>
            <h1 className="font-display font-black text-5xl md:text-6xl text-[#121212] mb-4">Fund verified causes with confidence</h1>
            <p className="text-[#555555] text-lg leading-relaxed">
              Browse medical, education, environment, community, and social impact fundraisers reviewed for transparency.
            </p>
          </div>
          <div className="glass rounded-[24px] p-4 md:p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#121212] mb-4">
              <SlidersHorizontal className="w-4 h-4 text-primary-700" /> Search and filters
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input value={search} onChange={(e) => handleSearchChange(e.target.value)} className="input pl-11" placeholder="Search campaigns, city, organizer..." />
                {search && (
                  <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-primary-700" aria-label="Clear search">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input md:w-48 cursor-pointer">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setCategory('')} className={`badge transition-all ${!category ? 'badge-yellow' : 'bg-white text-[#555555] border-[#EAEAEA] hover:text-primary-700'}`}>All Causes</button>
              {CATEGORIES.map(({ value, label, emoji }) => (
                <button key={value} onClick={() => setCategory(category === value ? '' : value)} className={`badge transition-all ${category === value ? 'badge-yellow' : 'bg-white text-[#555555] border-[#EAEAEA] hover:text-primary-700'}`}>
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-[20px] h-[430px] shimmer border border-[#EAEAEA]" />)}
          </div>
        ) : data?.campaigns?.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[24px] border border-[#EAEAEA]">
            <Search className="w-12 h-12 text-primary-300 mx-auto mb-4" />
            <h3 className="font-display font-black text-2xl text-[#121212] mb-2">No campaigns found</h3>
            <p className="text-[#555555]">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#555555] text-sm font-semibold">{data?.campaigns?.length} verified campaign{data?.campaigns?.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.campaigns?.map((c: any, i: number) => <CampaignCard key={c._id} campaign={c} index={i} />)}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CampaignsPage;
