import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NGOCardProps {
  ngo: {
    _id: string;
    name: string;
    logo?: string;
    description: string;
    location: { city: string; state: string };
    category: string;
    stats: {
      campaignCount: number;
      fundsRaised: number;
      beneficiaryCount: number;
      rating: number;
      impactScore: number;
    };
    foundedYear?: number;
    verificationStatus: string;
  };
}

const NGOCard: React.FC<NGOCardProps> = ({ ngo }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      className="relative flex flex-col bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[24px] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden group"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-transparent transition-colors duration-500 z-0" />

      <div className="relative z-10 p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="w-16 h-16 rounded-[16px] bg-primary-50 dark:bg-white/5 border border-primary-100 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {ngo.logo ? (
              <img src={ngo.logo} alt={ngo.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-2xl text-primary-600">{ngo.name.charAt(0)}</span>
            )}
          </div>
          {ngo.verificationStatus === 'verified' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[11px] font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-display font-bold text-xl text-text dark:text-white mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
            {ngo.name}
          </h3>
          <p className="text-text-muted text-[13px] font-medium flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5" /> {ngo.location.city}, {ngo.location.state}
            <span className="w-1 h-1 rounded-full bg-border" />
            {ngo.category}
          </p>
          <p className="text-[#555555] dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
            {ngo.description}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-[#EAEAEA] dark:border-white/10">
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="font-black text-text dark:text-white text-[15px]">
                ₹{ngo.stats.fundsRaised > 100000 ? (ngo.stats.fundsRaised / 100000).toFixed(1) + 'L' : ngo.stats.fundsRaised}
              </p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Raised</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="font-black text-text dark:text-white text-[15px]">
                {ngo.stats.campaignCount}
              </p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Campaigns</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-white/5">
              <p className="font-black text-primary-600 text-[15px] flex items-center justify-center gap-1">
                {ngo.stats.impactScore} <Star className="w-3 h-3 fill-current" />
              </p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Impact</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/ngos/${ngo._id}`}
              className="flex-1 btn-secondary py-2.5 rounded-[14px] text-sm group-hover:bg-primary-50 dark:group-hover:bg-primary-500/20 transition-colors"
            >
              View Profile
            </Link>
            <Link
              to={`/campaigns?ngo=${ngo._id}`}
              className="w-12 h-11 flex items-center justify-center rounded-[14px] bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              title="Donate to NGO's campaigns"
            >
              <Heart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NGOCard;
