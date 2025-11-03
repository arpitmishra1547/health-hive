"use client"

// Client wrapper to provide i18n to the entire app
import { I18nextProvider } from 'react-i18next';
import { Suspense, useEffect } from 'react';
import i18n from '@/i18n';

export default function I18nProvider({ children }) {
  // Ensure language from localStorage is applied on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('app_lang');
    if (stored && i18n.language !== stored) {
      i18n.changeLanguage(stored);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nextProvider>
  );
}


