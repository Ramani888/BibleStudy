export type SupportedLanguage = 'en' | 'es' | 'pt' | 'tl' | 'ko' | 'fr';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  tl: { code: 'tl', name: 'Tagalog', nativeName: 'Filipino' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français' },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'home'
  | 'library'
  | 'quiz'
  | 'ai'
  | 'profile'
  | 'navigation';
