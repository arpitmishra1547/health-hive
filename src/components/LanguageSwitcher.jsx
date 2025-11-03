"use client"

// Language switcher buttons that change language without reload
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  // Render nothing on server to avoid hydration mismatch when client picks stored language
  useEffect(() => { setMounted(true); }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('app_lang', lng); } catch {}
    // No reload required; components re-render automatically
  };

  const active = i18n.language || 'en';

  const items = [
    { code: 'en', label: t('lang.en'), flag: '🇬🇧' },
    { code: 'hi', label: t('lang.hi'), flag: '🇮🇳' },
    { code: 'mr', label: t('lang.mr'), flag: '🇮🇳' },
    { code: 'te', label: t('lang.te'), flag: '🇮🇳' },
    { code: 'bn', label: t('lang.bn'), flag: '🇮🇳' }
  ];

  if (!mounted) return null;

  return (
    <div className="flex gap-2 items-center">
      {items.map(item => (
        <button
          key={item.code}
          onClick={() => changeLang(item.code)}
          className={`px-2 py-1 rounded border ${active.startsWith(item.code) ? 'bg-blue-600 text-white' : 'bg-white'}`}
          title={item.label}
        >{item.flag} {item.label}</button>
      ))}
    </div>
  );
}


