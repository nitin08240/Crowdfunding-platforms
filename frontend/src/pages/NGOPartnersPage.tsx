import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Zap, LineChart, Globe2, Heart, 
  CheckCircle2, Search, ChevronDown, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import InteractiveIndiaMap from '../components/ngo/InteractiveIndiaMap';
import NGOCard from '../components/ngo/NGOCard';

const FADE_UP: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const STAGGER: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const NGOPartnersPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchVerifiedNGOs = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/ngos?verificationStatus=verified');
        if (data.data && Array.isArray(data.data)) {
          setNgos(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch verified NGOs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVerifiedNGOs();
  }, []);

  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ngo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? ngo.categories?.includes(categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] pt-24 overflow-hidden">
      {/* SECTION 1: PREMIUM HERO */}
      <section className="relative px-4 py-20 lg:py-32 overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px]" />
        </motion.div>

        <div className="container-app relative z-10 text-center max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={STAGGER}>
            <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-8">
              <ShieldCheck className="w-4 h-4" /> Trusted Partner Ecosystem
            </motion.div>

            <motion.div variants={FADE_UP}>
              <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-text dark:text-white tracking-tight leading-[1.1] mb-8">
                Empowering India's Most Impactful <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-amber-500">Non-Profits</span>
              </h1>
              <p className="text-text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
                Raise funds with 0% platform fee, connect with verified donors, and scale your social impact transparently.
              </p>
            </motion.div>

            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register-ngo" className="btn-primary py-4 px-8 text-lg rounded-full w-full sm:w-auto shadow-xl shadow-primary-500/25">
                Join as NGO
              </Link>
              <a href="#directory" className="btn-secondary py-4 px-8 text-lg rounded-full w-full sm:w-auto">
                Explore NGOs
              </a>
            </motion.div>

            {/* Live Stats Row */}
            <motion.div variants={FADE_UP} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-[#EAEAEA] dark:border-white/10 pt-10">
              {[
                { label: 'Verified NGOs', value: '500+' },
                { label: 'Campaigns', value: '20,000+' },
                { label: 'Raised', value: '₹15 Cr+' },
                { label: 'Donors', value: '100,000+' }
              ].map((stat, i) => (
                <div key={i}>
                  <p className="font-display font-black text-3xl md:text-4xl text-text dark:text-white mb-2">{stat.value}</p>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: WHY JOIN CROWDFUND */}
      <section className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-6">Why Join CrowdFund?</h2>
            <p className="text-text-muted text-lg">We provide everything you need to scale your fundraising and connect with passionate donors worldwide.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Verified Badge', desc: 'Build instant trust with donors through our rigorous verification process.' },
              { icon: Zap, title: 'Zero Setup', desc: 'Start raising funds immediately with absolutely no setup or subscription fees.' },
              { icon: Heart, title: 'Secure Donations', desc: 'Bank-grade security ensures every transaction is safe and transparent.' },
              { icon: Plus, title: 'Unlimited Campaigns', desc: 'Run as many concurrent campaigns as you need for various causes.' },
              { icon: LineChart, title: 'Real-time Dashboard', desc: 'Track donations, donor data, and campaign performance in real-time.' },
              { icon: Globe2, title: 'Volunteer Network', desc: 'Connect with volunteers eager to help your organization on the ground.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 rounded-[24px] p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-text dark:text-white mb-3">{feature.title}</h3>
                <p className="text-text-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW TO CONNECT YOUR NGO */}
      <section className="section">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-6">Become Our NGO Partner</h2>
            <p className="text-text-muted text-lg">A simple, transparent 5-step process to start raising funds on CrowdFund.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500/20 via-primary-500 to-primary-500/20 -translate-x-1/2" />
            
            {[
              { step: 1, title: 'Register NGO', desc: 'Create an account and provide basic organizational details.' },
              { step: 2, title: 'Upload Documents', desc: 'Submit Registration Certificate, PAN, 80G, 12A, and Bank Details securely.' },
              { step: 3, title: 'Verification', desc: 'Our team manually reviews your documents within 48-72 hours.' },
              { step: 4, title: 'Approval', desc: 'Once approved, you receive the Verified Badge on your profile.' },
              { step: 5, title: 'Start Fundraising', desc: 'Launch your first campaign and start receiving donations globally.' }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative flex flex-col md:flex-row items-center gap-8 mb-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={`flex-1 text-center md:text-${i % 2 === 0 ? 'left' : 'right'}`}>
                  <h3 className="font-display font-bold text-2xl text-text dark:text-white mb-3">{step.title}</h3>
                  <p className="text-text-muted text-lg">{step.desc}</p>
                </div>
                <div className="w-16 h-16 shrink-0 rounded-full bg-white dark:bg-[#121212] border-4 border-primary-500 flex items-center justify-center font-black text-xl text-primary-600 z-10 shadow-xl shadow-primary-500/20">
                  {step.step}
                </div>
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: INTERACTIVE INDIA MAP */}
      <section className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-6">Nationwide Impact</h2>
            <p className="text-text-muted text-lg">Explore the widespread network of our verified NGO partners making a difference across India.</p>
          </div>
          <InteractiveIndiaMap />
        </div>
      </section>

      {/* SECTION 5: NGO DIRECTORY */}
      <section id="directory" className="section">
        <div className="container-app">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-4">Explore All NGOs</h2>
              <p className="text-text-muted text-lg font-medium flex items-center gap-2">
                Currently Connected NGOs: <span className="px-3 py-1 bg-primary-100 dark:bg-primary-500/20 text-primary-700 font-black rounded-lg">532</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search NGOs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-50 dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none text-text dark:text-white"
                />
              </div>
              <div className="relative">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 rounded-full bg-gray-50 dark:bg-white/5 border border-[#EAEAEA] dark:border-white/10 focus:ring-2 focus:ring-primary-500 outline-none text-text dark:text-white font-semibold cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Environment">Environment</option>
                  <option value="Animal Welfare">Animal Welfare</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-[350px] bg-gray-100 dark:bg-white/5 animate-pulse rounded-[24px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNGOs.map(ngo => (
                <NGOCard key={ngo._id} ngo={ngo} />
              ))}
              {filteredNGOs.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-text-muted text-lg">No NGOs found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 9: WHY DONORS TRUST US */}
      <section className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-6">Why Donors Trust Us</h2>
            <p className="text-text-muted text-lg">Transparency and security are at the core of everything we do.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Verified NGOs', desc: 'Stringent KYC & document checks before onboarding.' },
              { title: 'Transparent Usage', desc: 'Detailed fund utilization reports provided by NGOs.' },
              { title: 'Secure Payments', desc: 'End-to-end encrypted transactions via trusted gateways.' },
              { title: 'Live Updates', desc: 'Real-time campaign progress and milestone tracking.' }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-white/5 rounded-[24px] p-6 border border-[#EAEAEA] dark:border-white/10 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg text-text dark:text-white mb-2">{item.title}</h4>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: JOIN OUR NGO NETWORK (CTA) */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="container-app relative z-10 text-center">
          <h2 className="font-display font-black text-4xl md:text-6xl text-white mb-6">Ready to Make a Bigger Impact?</h2>
          <p className="text-primary-100 text-xl max-w-2xl mx-auto mb-10">Become a verified NGO partner and connect with thousands of generous donors today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?tab=register" className="bg-white text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-full font-bold text-lg transition-colors">
              Register NGO Now
            </Link>
            <button className="bg-primary-700 text-white hover:bg-primary-800 border border-primary-500 px-8 py-4 rounded-full font-bold text-lg transition-colors">
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 11: FAQ */}
      <section className="section">
        <div className="container-app max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-3xl md:text-5xl text-text dark:text-white mb-6">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-4">
            {[
              { q: 'How can I register?', a: 'Click on the "Join as NGO" button, create an account, and fill in your organizational details to begin the process.' },
              { q: 'What documents are required?', a: 'We require your Registration Certificate, PAN Card, 80G Certificate, 12A Certificate, and verified Bank Account details.' },
              { q: 'How long is verification?', a: 'Our dedicated team manually verifies all documents within 48 to 72 hours of submission.' },
              { q: 'Is there any fee?', a: 'No, creating an account and launching campaigns is completely free. We charge a 0% platform fee.' }
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-50 dark:bg-white/5 rounded-[20px] border border-[#EAEAEA] dark:border-white/10 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 font-bold text-lg cursor-pointer text-text dark:text-white">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 pt-0 text-text-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default NGOPartnersPage;
