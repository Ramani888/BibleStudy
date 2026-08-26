import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English
import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import homeEn from './locales/en/home.json';
import libraryEn from './locales/en/library.json';
import quizEn from './locales/en/quiz.json';
import aiEn from './locales/en/ai.json';
import profileEn from './locales/en/profile.json';
import navigationEn from './locales/en/navigation.json';

// Spanish
import commonEs from './locales/es/common.json';
import authEs from './locales/es/auth.json';
import homeEs from './locales/es/home.json';
import libraryEs from './locales/es/library.json';
import quizEs from './locales/es/quiz.json';
import aiEs from './locales/es/ai.json';
import profileEs from './locales/es/profile.json';
import navigationEs from './locales/es/navigation.json';

// Portuguese
import commonPt from './locales/pt/common.json';
import authPt from './locales/pt/auth.json';
import homePt from './locales/pt/home.json';
import libraryPt from './locales/pt/library.json';
import quizPt from './locales/pt/quiz.json';
import aiPt from './locales/pt/ai.json';
import profilePt from './locales/pt/profile.json';
import navigationPt from './locales/pt/navigation.json';

// French
import commonFr from './locales/fr/common.json';
import authFr from './locales/fr/auth.json';
import homeFr from './locales/fr/home.json';
import libraryFr from './locales/fr/library.json';
import quizFr from './locales/fr/quiz.json';
import aiFr from './locales/fr/ai.json';
import profileFr from './locales/fr/profile.json';
import navigationFr from './locales/fr/navigation.json';

// Korean
import commonKo from './locales/ko/common.json';
import authKo from './locales/ko/auth.json';
import homeKo from './locales/ko/home.json';
import libraryKo from './locales/ko/library.json';
import quizKo from './locales/ko/quiz.json';
import aiKo from './locales/ko/ai.json';
import profileKo from './locales/ko/profile.json';
import navigationKo from './locales/ko/navigation.json';

// Tagalog
import commonTl from './locales/tl/common.json';
import authTl from './locales/tl/auth.json';
import homeTl from './locales/tl/home.json';
import libraryTl from './locales/tl/library.json';
import quizTl from './locales/tl/quiz.json';
import aiTl from './locales/tl/ai.json';
import profileTl from './locales/tl/profile.json';
import navigationTl from './locales/tl/navigation.json';

import { DEFAULT_LANGUAGE } from './types';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    home: homeEn,
    library: libraryEn,
    quiz: quizEn,
    ai: aiEn,
    profile: profileEn,
    navigation: navigationEn,
  },
  es: {
    common: commonEs,
    auth: authEs,
    home: homeEs,
    library: libraryEs,
    quiz: quizEs,
    ai: aiEs,
    profile: profileEs,
    navigation: navigationEs,
  },
  pt: {
    common: commonPt,
    auth: authPt,
    home: homePt,
    library: libraryPt,
    quiz: quizPt,
    ai: aiPt,
    profile: profilePt,
    navigation: navigationPt,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    home: homeFr,
    library: libraryFr,
    quiz: quizFr,
    ai: aiFr,
    profile: profileFr,
    navigation: navigationFr,
  },
  ko: {
    common: commonKo,
    auth: authKo,
    home: homeKo,
    library: libraryKo,
    quiz: quizKo,
    ai: aiKo,
    profile: profileKo,
    navigation: navigationKo,
  },
  tl: {
    common: commonTl,
    auth: authTl,
    home: homeTl,
    library: libraryTl,
    quiz: quizTl,
    ai: aiTl,
    profile: profileTl,
    navigation: navigationTl,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  compatibilityJSON: 'v4',
  react: {
    useSuspense: false,
  },
});

export default i18n;
export * from './types';
export * from './language.store';
