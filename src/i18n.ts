import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ko from './locales/ko.json';

// Get language from localStorage or use browser preferred language if available
const getStoredLanguage = () => {
    if (typeof window === 'undefined') return 'en';

    // Check localStorage first
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang) return storedLang;

    // Try to detect browser language as fallback
    const browserLang = navigator.language;
    if (browserLang && browserLang.toLowerCase().startsWith('ko')) {
        return 'ko';
    }

    // Default to English
    return 'en';
};

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        ko: { translation: ko },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', lng);
    }
});

export default i18n;
