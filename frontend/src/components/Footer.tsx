import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Heart, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  
  const groups = [
    { title: t('footer.groups.company'), items: [
      { label: t('footer.links.about'), href: '/about' },
      { label: t('footer.links.careers'), href: '#' },
      { label: t('footer.links.press'), href: '#' },
      { label: t('footer.links.contact'), href: '#' }
    ]},
    { title: t('footer.groups.resources'), items: [
      { label: t('footer.links.blog'), href: '#' },
      { label: t('footer.links.faqs'), href: '#' },
      { label: t('footer.links.successStories'), href: '/success-stories' },
      { label: t('footer.links.impact'), href: '/impact' }
    ]},
    { title: t('footer.groups.ngo'), items: [
      { label: t('footer.links.becomePartner'), href: '/ngo-partners' },
      { label: t('footer.links.verification'), href: '/ngo-partners' },
      { label: t('footer.links.guidelines'), href: '/ngo-partners' },
      { label: t('footer.links.findNgos'), href: '/ngo-partners' }
    ]},
    { title: t('footer.groups.legal'), items: [
      { label: t('footer.links.privacy'), href: '#' },
      { label: t('footer.links.terms'), href: '#' },
      { label: t('footer.links.refund'), href: '#' }
    ]},
  ];

  return (
  <footer className="mt-20 border-t border-[#EAEAEA] dark:border-border bg-white dark:bg-background">
    <div className="container-app py-14">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl text-text">CrowdFund</span>
              <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{t('footer.tagline')}</p>
            </div>
          </Link>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm">
            {t('footer.desc')}
          </p>
          <div className="flex gap-3 mt-6">
            {[Globe, Mail, Heart, MapPin].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all" aria-label="Social link">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="font-display font-extrabold text-text mb-4">{group.title}</h4>
            <ul className="space-y-3">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-text-muted hover:text-primary transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-muted">{t('footer.rights')}</p>
        <div className="flex items-center gap-2 text-sm font-semibold text-text-muted">
          {t('footer.madeWith')} <Heart className="w-4 h-4 text-primary" fill="currentColor" /> {t('footer.forChangemakers')}
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
