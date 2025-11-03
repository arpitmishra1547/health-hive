// Frontend i18n initialization
// - Loads resources from /src/locales
// - Detects language from localStorage and browser
// - Persists selection in localStorage
// - No page reload required

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Fallback resources bundled with app (for SSR/first paint)
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import te from './locales/te.json';
import bn from './locales/bn.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  te: { translation: te },
  bn: { translation: bn }
};

if (!i18n.isInitialized) {
  i18n
    // Load via HTTP first (optional), then fallback to in-bundle resources
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      resources,
      // IMPORTANT: lock initial language to 'en' for SSR to avoid hydration mismatch.
      // We switch to the stored preference on client mount in I18nProvider.
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi', 'mr', 'te', 'bn'],
      ns: ['translation'],
      defaultNS: 'translation',
      interpolation: { escapeValue: false },
      // Avoid extra console noise
      debug: false
    });
}

export default i18n;


