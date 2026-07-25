import { useRef, useState } from 'react';
import type { FC } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Building2, ChevronRight, Globe2, Heart,
  MapPin, ShieldCheck, Sparkles, TrendingUp, Users, Quote,
  CheckCircle2, Mail, Phone, MapPinHouse, Plus, Minus,
  Zap, Lock, Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, Trans } from 'react-i18next';
import { campaignService } from '../services/campaign.service';
import CampaignCard from '../components/CampaignCard';
import Footer from '../components/Footer';

// ─── Sub-components ───────────────────────────────────────────────────
const Counter: FC<{ value: string }> = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <span ref={ref}>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        {value}
      </motion.span>
    </span>
  );
};

const SectionLabel: FC<{ text: string; light?: boolean }> = ({ text, light }) => (
  <p className={`text-[11px] font-extrabold mb-3 uppercase tracking-[0.18em] ${light ? 'text-primary-400' : 'text-primary-600 dark:text-primary-400'}`}>
    {text}
  </p>
);

const FaqItem: FC<{ q: string; a: string; i: number }> = ({ q, a, i }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.07 }}
      className="border border-border rounded-[20px] overflow-hidden bg-card"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-expanded={open}
      >
        <span className="font-bold text-[15px] text-text leading-snug">{q}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${open ? 'bg-primary-500 text-white' : 'bg-black/5 dark:bg-white/10 text-text-muted'}`}>
          {open ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[15px] text-text-muted leading-relaxed border-t border-border pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────
const LandingPage: FC = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['featured-campaigns'],
    queryFn: () => campaignService.getAll({ status: 'active', limit: 6, sort: '-raisedAmount' }),
  });

  return (
    <div className="min-h-screen bg-transparent">

      {/* ══ 1. HERO ══════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative overflow-hidden"
        style={{ paddingTop: 'clamp(120px, 14vw, 180px)', paddingBottom: 'clamp(80px, 10vw, 120px)' }}
      >
        {/* Background mesh (Light mode only, dark mode uses solid background) */}
        <div className="absolute inset-0 pointer-events-none select-none dark:hidden" aria-hidden>
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute top-60 -left-32 w-[500px] h-[500px] rounded-full bg-blue-50/60 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_60%,rgba(255,255,255,1)_100%)]" />
        </div>

        <div className="container-app relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-[12px] font-bold mb-8 tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                {t('landing.hero.trustBadge')}
              </div>

              <h1 className="font-display font-black text-[clamp(40px,5.5vw,72px)] leading-[1.04] text-text tracking-[-0.02em] mb-6">
                {t('landing.hero.title1')}<br />
                {t('landing.hero.title2')}<br />
                <span className="relative">
                  <span className="text-primary-600 dark:text-primary-400">{t('landing.hero.title3')}</span>
                </span>
              </h1>

              <p className="text-[clamp(16px,1.4vw,20px)] text-text-muted leading-relaxed max-w-xl mb-10 font-medium">
                {t('landing.hero.subtitle')}
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <motion.a
                  href="/create-campaign"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary"
                >
                  <Sparkles className="w-4 h-4 opacity-80" />
                  {t('landing.hero.startCampaign')}
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
                <motion.a
                  href="#featured-campaigns"
                  whileHover={{ y: -1 }}
                  className="btn-secondary"
                >
                  {t('landing.hero.explore')}
                </motion.a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-5 text-[13px] font-semibold text-text-muted">
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-primary-500" />{t('landing.hero.trust.secure')}</span>
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary-500" />{t('landing.hero.trust.fee')}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary-500" />{t('landing.hero.trust.verification')}</span>
              </div>
            </motion.div>

            {/* Right — Hero visual */}
            <motion.div
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="rounded-[36px] overflow-hidden shadow-2xl ring-4 ring-white dark:ring-white/10">
                <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1100&q=85" alt="Community volunteers" className="w-full h-[500px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
              </div>

              {/* Floating stat cards */}
              {[
                { value: '₹12Cr+', label: t('landing.hero.stats.raised'), icon: TrendingUp, pos: { bottom: '-20px', left: '20px' } },
                { value: '75K+', label: t('landing.hero.stats.donors'), icon: Users, pos: { top: '24px', right: '-16px' } },
              ].map(({ value, label, icon: Icon, pos }, i) => (
                <motion.div
                  key={label}
                  className="absolute bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-[22px] px-5 py-4 shadow-xl border border-white dark:border-white/10"
                  style={pos}
                  animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[12px] bg-primary-50 dark:bg-primary-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-display font-black text-[22px] text-text leading-none"><Counter value={value} /></p>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                className="absolute bottom-10 right-4 bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-lg border border-white dark:border-white/10 flex items-center gap-2"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[12px] font-bold text-text">{t('landing.hero.livePill')}</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 2. FEATURED CAMPAIGNS ══════════════════════════════════════ */}
      {data?.campaigns?.length > 0 && (
        <section id="featured-campaigns" className="section bg-black/5 dark:bg-white/[0.02]">
          <div className="container-app">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
              <div>
                <SectionLabel text={t('landing.featured.label')} />
                <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight">
                  {t('landing.featured.title')}
                </h2>
              </div>
              <motion.a href="/campaigns" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group mb-1" whileHover={{ x: 2 }}>
                {t('landing.featured.viewAll')} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {data.campaigns.map((c: any, i: number) => (
                <CampaignCard key={c._id} campaign={c} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 3. HOW IT WORKS ════════════════════════════════════════════ */}
      <section id="how-it-works" className="section bg-transparent">
        <div className="container-app">
          <div className="text-center mb-16">
            <SectionLabel text={t('landing.howItWorks.label')} />
            <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-[17px] text-text-muted mt-4 max-w-xl mx-auto">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[52px] left-[calc(16.6%+32px)] right-[calc(16.6%+32px)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {[
              { num: '01', title: t('landing.howItWorks.steps.1.title'), desc: t('landing.howItWorks.steps.1.desc'), icon: Sparkles  },
              { num: '02', title: t('landing.howItWorks.steps.2.title'), desc: t('landing.howItWorks.steps.2.desc'), icon: Globe2    },
              { num: '03', title: t('landing.howItWorks.steps.3.title'), desc: t('landing.howItWorks.steps.3.desc'), icon: TrendingUp},
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="card hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-500/30 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-[20px] bg-gradient-to-br from-primary-500 to-primary-light flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <step.icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-2">{step.num}</p>
                <h3 className="font-display font-black text-xl text-text mb-3">{step.title}</h3>
                <p className="text-[15px] text-text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. IMPACT NUMBERS ══════════════════════════════════════════ */}
      <section id="impact" className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app">
          <div className="relative rounded-[40px] overflow-hidden bg-[#0f0f0f] p-12 md:p-20">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 text-center mb-14">
              <SectionLabel text={t('landing.impact.label')} light />
              <h2 className="font-display font-black text-4xl md:text-5xl text-white tracking-tight">
                {t('landing.impact.title')}
              </h2>
            </div>

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-2">
              {[
                { value: '₹12Cr+', label: t('landing.impact.stats.raised'), icon: TrendingUp, color: 'text-primary-400' },
                { value: '1,200+', label: t('landing.impact.stats.campaigns'),     icon: Heart,      color: 'text-pink-400'    },
                { value: '75,000+', label: t('landing.impact.stats.donors'),       icon: Users,      color: 'text-blue-400'    },
                { value: '350+',   label: t('landing.impact.stats.ngos'), icon: Building2,  color: 'text-green-400'   },
              ].map(({ value, label, icon: Icon, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-[24px] bg-white/5 border border-white/8 hover:bg-white/8 transition-colors">
                  <Icon className={`w-7 h-7 mx-auto mb-4 ${color}`} strokeWidth={1.5} />
                  <p className="font-display font-black text-[clamp(32px,4vw,52px)] text-white leading-none mb-2"><Counter value={value} /></p>
                  <p className="text-[11px] font-bold text-[#aaa] uppercase tracking-widest">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. SUCCESS STORIES ═════════════════════════════════════════ */}
      <section id="success-stories" className="section bg-transparent">
        <div className="container-app">
          <div className="text-center mb-14">
            <SectionLabel text={t('landing.stories.label')} />
            <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight">
              {t('landing.stories.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80', title: 'Heart surgery for 5-year old Aarav', raised: '₹4.5L', days: 12, tag: 'Medical' },
              { img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', title: 'Rebuilding Kerala after the 2024 floods', raised: '₹2.1Cr', days: 45, tag: 'Disaster Relief' },
            ].map((story, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative rounded-[32px] overflow-hidden cursor-pointer bg-black shadow-xl">
                <img src={story.img} alt={story.title} className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/90 backdrop-blur-md rounded-full text-white text-[11px] font-bold">{story.tag}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-white text-[11px] font-bold border border-white/20"><CheckCircle2 className="w-3 h-3" /> {t('landing.stories.fullyFunded')}</span>
                  </div>
                  <h3 className="font-display font-black text-2xl text-white mb-2 leading-snug">{story.title}</h3>
                  <p className="text-white/70 font-medium text-[14px]">
                    <Trans i18nKey="landing.stories.raisedInDays" values={{ amount: story.raised, days: story.days }}>
                      Raised <span className="text-primary-300 font-black">{story.raised}</span> in just {story.days} days
                    </Trans>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. TOP NGOs ════════════════════════════════════════════════ */}
      <section id="ngos" className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app">
          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-14 items-center">
            <div>
              <SectionLabel text={t('landing.ngos.label')} />
              <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight mb-6">
                {t('landing.ngos.title')}
              </h2>
              <p className="text-[17px] text-text-muted leading-relaxed mb-8 font-medium">
                {t('landing.ngos.subtitle')}
              </p>

              <div className="space-y-5 mb-10">
                {[
                  { icon: ShieldCheck, title: t('landing.ngos.points.1.title'), text: t('landing.ngos.points.1.desc') },
                  { icon: BadgeCheck,  title: t('landing.ngos.points.2.title'), text: t('landing.ngos.points.2.desc') },
                  { icon: Globe2,      title: t('landing.ngos.points.3.title'), text: t('landing.ngos.points.3.desc') },
                ].map((tpt, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-[14px] bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <tpt.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text mb-0.5">{tpt.title}</h4>
                      <p className="text-[14px] text-text-muted leading-snug">{tpt.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/ngo-partners" className="btn-secondary rounded-full text-[14px]">
                {t('landing.ngos.exploreAll')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Aarohan Learning Trust', city: 'Pune, Maharashtra',   category: 'Education',   projects: 18, raised: '₹82L',   score: 96 },
                { name: 'Seva Health Foundation', city: 'Jaipur, Rajasthan',   category: 'Medical',     projects: 31, raised: '₹1.4Cr', score: 98 },
                { name: 'Green Roots Collective', city: 'Kochi, Kerala',       category: 'Environment', projects: 12, raised: '₹44L',   score: 94 },
              ].map((ngo, i) => (
                <motion.div key={ngo.name} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-5 flex items-center gap-4 hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-500/30 cursor-pointer group">
                  <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-primary-500 to-primary-light text-white flex items-center justify-center font-display font-black text-2xl shadow-md shadow-primary-500/15 shrink-0">
                    {ngo.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-[15px] text-text truncate group-hover:text-primary transition-colors">{ngo.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                    </div>
                    <p className="text-[13px] text-text-muted font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {ngo.city} · {ngo.category}</p>
                  </div>
                  <div className="flex gap-5 text-right shrink-0">
                    <div>
                      <p className="font-black text-text text-[15px]">{ngo.raised}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide">{t('landing.ngos.raised')}</p>
                    </div>
                    <div>
                      <p className="font-black text-text text-[15px]">{ngo.score}<span className="text-[10px] text-text-muted font-bold">/100</span></p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide">{t('landing.ngos.trust')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ════════════════════════════════════════════ */}
      <section id="testimonials" className="section bg-[#0f0f0f] text-white overflow-hidden">
        <div className="container-app">
          <div className="text-center mb-14">
            <SectionLabel text={t('landing.testimonials.label')} light />
            <h2 className="font-display font-black text-4xl md:text-5xl text-white tracking-tight">
              {t('landing.testimonials.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "I raised funds for my daughter's education in just 3 days. The platform is incredibly easy to use.",          name: 'Sunita Sharma', role: 'Campaigner',    avatar: 'SS' },
              { t: "The transparency and 0% fee structure makes this the best crowdfunding platform in India. Period.",            name: 'Rajesh Kumar',  role: 'Regular Donor', avatar: 'RK' },
              { t: "Our NGO has connected with thousands of donors through this network. It genuinely changed everything for us.", name: 'Anjali Desai',  role: 'NGO Director',  avatar: 'AD' },
            ].map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative bg-white/[0.04] border border-white/[0.08] rounded-[32px] p-8 hover:bg-white/[0.07] transition-colors">
                <div className="flex gap-0.5 mb-6">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 text-primary-400 fill-primary-400" />)}
                </div>
                <Quote className="absolute top-6 right-6 w-10 h-10 text-white/[0.04]" fill="currentColor" />
                <p className="text-[15px] leading-relaxed text-white/75 mb-8 font-medium">"{r.t}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-light flex items-center justify-center text-white text-[13px] font-black shadow-md">{r.avatar}</div>
                  <div>
                    <p className="font-bold text-white text-[14px]">{r.name}</p>
                    <p className="text-[12px] text-primary-400 font-semibold">{r.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. FAQs ════════════════════════════════════════════════════ */}
      <section id="faqs" className="section bg-transparent">
        <div className="container-app max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel text={t('landing.faqs.label')} />
            <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight">
              {t('landing.faqs.title')}
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How do I know the campaigns are genuine?',       a: 'Every campaign goes through a strict 3-step verification process checking government IDs, bank details, and medical/purpose documents before going live.' },
              { q: 'What percentage of my donation reaches the cause?', a: 'We charge 0% platform fee. 100% of your donation goes to the campaigner (minus standard payment gateway charges of 1–2%).'                          },
              { q: 'Can I get a tax exemption certificate (80G)?',   a: 'Yes. Donations made to our verified NGO partners are eligible for 80G tax exemptions. You will receive the certificate via email automatically.'       },
              { q: 'Is my payment information secure?',              a: 'Absolutely. We use bank-grade 256-bit SSL encryption and are PCI-DSS compliant. Your payment data is never stored on our servers.'                       },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. ABOUT ═══════════════════════════════════════════════════ */}
      <section id="about" className="section bg-black/5 dark:bg-white/[0.02]">
        <div className="container-app text-center max-w-3xl mx-auto">
          <SectionLabel text={t('landing.about.label')} />
          <h2 className="font-display font-black text-4xl md:text-5xl text-text tracking-tight mb-6">
            {t('landing.about.title')}
          </h2>
          <p className="text-[17px] text-text-muted leading-relaxed mb-12 font-medium">
            {t('landing.about.subtitle')}
          </p>
          <div className="grid grid-cols-3 gap-8 border-t border-border pt-10">
            {[
              { val: '0%',   label: t('landing.about.stats.fee') },
              { val: '24/7', label: t('landing.about.stats.support') },
              { val: '100%', label: t('landing.about.stats.secure') },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="font-display font-black text-4xl text-text mb-1">{val}</p>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 10. CONTACT ════════════════════════════════════════════════ */}
      <section id="contact" className="section bg-transparent">
        <div className="container-app max-w-5xl mx-auto">
          <div className="rounded-[40px] overflow-hidden bg-gradient-to-br from-[#1a0e00] via-[#121212] to-[#0a0a0a] p-10 md:p-16 grid md:grid-cols-2 gap-12 items-center shadow-2xl">
            <div>
              <SectionLabel text={t('landing.contact.label')} light />
              <h2 className="font-display font-black text-4xl text-white tracking-tight mb-4">
                {t('landing.contact.title')}
              </h2>
              <p className="text-white/60 mb-10 font-medium leading-relaxed">
                {t('landing.contact.subtitle')}
              </p>
              <div className="space-y-6">
                {[
                  { icon: Mail,         label: t('landing.contact.email'),  value: 'support@crowdfund.org'    },
                  { icon: Phone,        label: t('landing.contact.phone'),  value: '+91 98765 43210'           },
                  { icon: MapPinHouse,  label: t('landing.contact.office'), value: 'HSR Layout, Bangalore'     },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold mb-0.5">{label}</p>
                      <p className="font-bold text-white text-[14px]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-[28px] p-8 shadow-xl">
              <h3 className="font-display font-bold text-xl text-text mb-6">{t('landing.contact.form.title')}</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder={t('landing.contact.form.name')} className="input" />
                  <input type="email" placeholder={t('landing.contact.form.email')} className="input" />
                </div>
                <input type="text" placeholder={t('landing.contact.form.subject')} className="input" />
                <textarea placeholder={t('landing.contact.form.message')} rows={4} className="input resize-none" />
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="w-full btn-primary py-3.5">
                  {t('landing.contact.form.submit')}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
