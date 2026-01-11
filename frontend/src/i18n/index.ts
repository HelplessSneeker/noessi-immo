import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import deTranslations from './locales/de.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: deTranslations },
      en: { translation: enTranslations },
    },
    fallbackLng: 'de',  // Default to German
    lng: 'de',          // Force German as default
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['navigator'], // Could detect from browser, but we default to 'de'
      caches: [],          // Don't persist language selection
    },
  });

export default i18n;
