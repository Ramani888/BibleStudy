import { create } from 'zustand';
import i18n from './index';
import { storage } from '../utils/storage';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from './types';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>(set => ({
  language: DEFAULT_LANGUAGE,
  setLanguage: async (lang: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(lang);
      set({ language: lang });
      await storage.setLanguageCode(lang);
    } catch (error) {
      console.error('[i18n] Failed to change language:', error);
    }
  },
  hydrate: async () => {
    try {
      const saved = await storage.getLanguageCode();
      if (saved && (saved === 'en' || saved === 'es' || saved === 'pt' || saved === 'tl' || saved === 'ko' || saved === 'fr')) {
        await i18n.changeLanguage(saved);
        set({ language: saved as SupportedLanguage });
      }
    } catch (error) {
      console.error('[i18n] Failed to hydrate language preference:', error);
    }
  },
}));
