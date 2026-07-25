import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import type { Campaign } from '../types';
import { CATEGORIES } from '../types';

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, index = 0 }) => {
  const percent = Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));
  const category = CATEGORIES.find((c) => c.value === campaign.category);
  const image = campaign.images?.[0] || `https://placehold.co/900x540/fff4dd/a66a00?text=${encodeURIComponent(campaign.title)}`;
  const creatorName = (campaign.creator as any)?.name || 'Verified organizer';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.05 }}
      className="glass-hover rounded-[20px] overflow-hidden flex flex-col group bg-white"
    >
      <Link to={`/campaigns/${campaign.slug}`} className="flex flex-col h-full">
        <div className="relative h-56 overflow-hidden bg-primary-50">
          <img
            src={image}
            alt={campaign.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/900x540/fff4dd/a66a00?text=Verified+Campaign';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {category && <span className="badge bg-white/95 text-primary-800 border-white/80">{category.emoji} {category.label}</span>}
            <span className="badge bg-white/95 text-green-700 border-white/80"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
          </div>
          {percent >= 100 && (
            <span className="absolute top-3 right-3 badge-green bg-white/95">
              <TrendingUp className="w-3.5 h-3.5" /> Funded
            </span>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#555555] mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Trusted Organizer
          </div>
          <h3 className="font-display font-extrabold text-[#121212] text-lg leading-snug mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {campaign.title}
          </h3>
          <p className="text-sm text-[#555555] line-clamp-2 mb-5 flex-1">{campaign.description}</p>

          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-2xl font-black text-[#121212]">₹{campaign.raisedAmount.toLocaleString()}</p>
                <p className="text-xs text-[#555555]">raised of ₹{campaign.goalAmount.toLocaleString()}</p>
              </div>
              <p className="text-sm font-extrabold text-primary-700">{percent}%</p>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-[#555555] pt-4 border-t border-[#EAEAEA]">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {campaign.donorCount}</span>
            <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5" /> {campaign.location || 'India'}</span>
            <span className={`flex items-center gap-1.5 justify-end ${daysLeft <= 7 ? 'text-red-600 font-bold' : ''}`}>
              <Clock className="w-3.5 h-3.5" /> {daysLeft > 0 ? `${daysLeft}d` : 'Ended'}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-black">
          {creatorName.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-[#555555]">Organized by</p>
          <p className="text-sm font-bold text-[#121212]">{creatorName}</p>
        </div>
      </div>
    </motion.article>
  );
};

export default CampaignCard;
