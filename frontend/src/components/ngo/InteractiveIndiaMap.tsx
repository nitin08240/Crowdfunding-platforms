import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Users, Heart, IndianRupee, MapPin } from 'lucide-react';

interface StateData {
  id: string;
  name: string;
  ngoCount: number;
  fundsRaised: number;
  campaigns: number;
  beneficiaries: number;
  topNGOs: string[];
}

const indianStates: StateData[] = [
  { id: 'MH', name: 'Maharashtra', ngoCount: 145, fundsRaised: 45000000, campaigns: 1200, beneficiaries: 45000, topNGOs: ['Smile Foundation', 'Goonj'] },
  { id: 'KA', name: 'Karnataka', ngoCount: 98, fundsRaised: 28000000, campaigns: 850, beneficiaries: 22000, topNGOs: ['Akshaya Patra', 'Ketto Foundation'] },
  { id: 'DL', name: 'Delhi', ngoCount: 120, fundsRaised: 32000000, campaigns: 900, beneficiaries: 35000, topNGOs: ['Cry India', 'Care India'] },
  { id: 'TN', name: 'Tamil Nadu', ngoCount: 85, fundsRaised: 19000000, campaigns: 600, beneficiaries: 18000, topNGOs: ['Bhumi', 'Vidya'] },
  { id: 'GJ', name: 'Gujarat', ngoCount: 60, fundsRaised: 15000000, campaigns: 450, beneficiaries: 12000, topNGOs: ['Pratham', 'SEWA'] },
];

export const InteractiveIndiaMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<StateData | null>(indianStates[0]);

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/10 rounded-[32px] p-8 lg:p-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Abstract Map Area */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg aspect-square relative flex items-center justify-center">
            {/* Pulsing background ring */}
            <div className="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-8 border-2 border-primary-500/30 rounded-full animate-ping opacity-30" style={{ animationDuration: '4s' }} />
            
            <div className="relative w-full h-full p-8 flex flex-wrap place-content-center gap-4">
              {indianStates.map((state) => (
                <motion.button
                  key={state.id}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedState(state)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 font-bold text-sm shadow-sm
                    ${selectedState?.id === state.id 
                      ? 'bg-primary-600 text-white shadow-primary-500/25 ring-4 ring-primary-500/20' 
                      : 'bg-white dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 text-text dark:text-gray-300 hover:border-primary-500/30 hover:shadow-lg'}`}
                >
                  <MapPin className={`w-4 h-4 ${selectedState?.id === state.id ? 'text-white' : 'text-primary-600'}`} />
                  {state.name}
                </motion.button>
              ))}
              
              {/* Dummy extra dots to create a map-like spread feel */}
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/5 m-4" />
              ))}
            </div>
          </div>
          
          <p className="text-center text-text-muted text-sm mt-8 max-w-md mx-auto">
            Click on a state to explore the verified NGO network and see the collective impact created in that region.
          </p>
        </div>

        {/* State Detail Panel */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {selectedState && (
              <motion.div
                key={selectedState.id}
                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-[16px] bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center">
                    <Map className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-2xl text-text dark:text-white">
                      {selectedState.name}
                    </h3>
                    <p className="text-primary-600 font-bold text-sm tracking-wide">
                      {selectedState.ngoCount} Verified NGOs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white dark:bg-white/5 rounded-[16px] p-4 border border-[#EAEAEA] dark:border-white/10">
                    <div className="flex items-center gap-2 text-text-muted mb-2">
                      <IndianRupee className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Funds Raised</span>
                    </div>
                    <p className="font-display font-black text-xl text-text dark:text-white">
                      ₹{(selectedState.fundsRaised / 10000000).toFixed(1)} Cr
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-white/5 rounded-[16px] p-4 border border-[#EAEAEA] dark:border-white/10">
                    <div className="flex items-center gap-2 text-text-muted mb-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Campaigns</span>
                    </div>
                    <p className="font-display font-black text-xl text-text dark:text-white">
                      {selectedState.campaigns.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-white/5 rounded-[16px] p-4 border border-[#EAEAEA] dark:border-white/10 col-span-2">
                    <div className="flex items-center gap-2 text-text-muted mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Lives Impacted</span>
                    </div>
                    <p className="font-display font-black text-2xl text-text dark:text-white">
                      {selectedState.beneficiaries.toLocaleString()}+
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">Top NGOs in {selectedState.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedState.topNGOs.map((ngo, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 text-sm font-semibold text-text dark:text-gray-300">
                        {ngo}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InteractiveIndiaMap;
