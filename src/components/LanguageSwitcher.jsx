"use client"

// Language switcher with toggle dropdown
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Render nothing on server to avoid hydration mismatch when client picks stored language
  useEffect(() => { setMounted(true); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.language-switcher-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('app_lang', lng); } catch {}
    setIsOpen(false);
    // No reload required; components re-render automatically
  };

  const active = i18n.language || 'en';

  const items = [
    { code: 'en', label: t('lang.en'), flag: '🇬🇧', name: 'English' },
    { code: 'hi', label: t('lang.hi'), flag: '🇮🇳', name: 'हिंदी' },
    { code: 'mr', label: t('lang.mr'), flag: '🇮🇳', name: 'मराठी' },
    { code: 'te', label: t('lang.te'), flag: '🇮🇳', name: 'తెలుగు' },
    { code: 'bn', label: t('lang.bn'), flag: '🇮🇳', name: 'বাংলা' }
  ];

  const currentLang = items.find(item => active.startsWith(item.code)) || items[0];

  if (!mounted) return null;

  return (
    <div className="relative language-switcher-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentLang.flag} {currentLang.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {items.map(item => (
            <button
              key={item.code}
              onClick={() => changeLang(item.code)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                active.startsWith(item.code) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{item.flag}</span>
              <span className="text-sm">{item.name}</span>
              {active.startsWith(item.code) && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


