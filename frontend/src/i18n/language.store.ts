import { create } from 'zustand';
import { NativeModules, Platform } from 'react-native';
import i18n from './index';
import { storage } from '../utils/storage';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from './types';

const SUPPORTED: readonly SupportedLanguage[] = ['en', 'es', 'pt', 'tl', 'ko', 'fr'];
const isSupported = (v: unknown): v is SupportedLanguage =>
  typeof v === 'string' && (SUPPORTED as readonly string[]).includes(v);

/** Best-effort device locale, zero-dependency. Empty string if unavailable. */
function deviceLocale(): string {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

/** Map the device locale (e.g. "pt_BR", "fil-PH") to a supported language, or null. */
function deviceLanguage(): SupportedLanguage | null {
  const primary = deviceLocale().toLowerCase().split(/[-_]/)[0];
  if (!primary) return null;
  if (primary === 'fil') return 'tl'; // Filipino → Tagalog
  return isSupported(primary) ? primary : null;
}

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
      if (isSupported(saved)) {
        await i18n.changeLanguage(saved);
        set({ language: saved });
        return;
      }
      // No explicit choice yet → follow the device locale (e.g. Brazil → Portuguese).
      const device = deviceLanguage();
      if (device && device !== DEFAULT_LANGUAGE) {
        await i18n.changeLanguage(device);
        set({ language: device });
      }
    } catch (error) {
      console.error('[i18n] Failed to hydrate language preference:', error);
    }
  },
}));
