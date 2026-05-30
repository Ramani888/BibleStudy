import {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from './adIds';

const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };

const INTERSTITIAL_COOLDOWN_MS = 60 * 60 * 1000;  // 60 minutes
const APP_OPEN_COOLDOWN_MS     = 4 * 60 * 60 * 1000; // 4 hours

// ─── Interstitial ─────────────────────────────────────────────────────────────

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let interstitialShowing = false;
let lastInterstitialTime = 0;

function setupInterstitial() {
  const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, AD_REQUEST_OPTIONS);

  const u1 = ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  const u2 = ad.addAdEventListener(AdEventType.CLOSED, () => {
    u1(); u2(); u3();
    interstitialShowing = false;
    lastInterstitialTime = Date.now();
    setupInterstitial();
  });

  const u3 = ad.addAdEventListener(AdEventType.ERROR, () => {
    u1(); u2(); u3();
    interstitialLoaded = false;
    interstitialShowing = false;
    setTimeout(setupInterstitial, 60_000);
  });

  ad.load();
  interstitial = ad;
  interstitialLoaded = false;
}

export function loadInterstitial(): void {
  setupInterstitial();
}

export function showInterstitial(): void {
  const now = Date.now();
  if (!interstitialLoaded || !interstitial || interstitialShowing) return;
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) return;
  interstitialShowing = true;
  interstitial.show();
}

// ─── App Open ─────────────────────────────────────────────────────────────────

let appOpen: AppOpenAd | null = null;
let appOpenLoaded = false;
let appOpenShowing = false;
let lastAppOpenTime = 0;

function setupAppOpen() {
  const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen, AD_REQUEST_OPTIONS);

  const u1 = ad.addAdEventListener(AdEventType.LOADED, () => {
    appOpenLoaded = true;
  });

  const u2 = ad.addAdEventListener(AdEventType.CLOSED, () => {
    u1(); u2(); u3();
    appOpenShowing = false;
    lastAppOpenTime = Date.now();
    setupAppOpen();
  });

  const u3 = ad.addAdEventListener(AdEventType.ERROR, () => {
    u1(); u2(); u3();
    appOpenLoaded = false;
    appOpenShowing = false;
    setTimeout(setupAppOpen, 60_000);
  });

  ad.load();
  appOpen = ad;
  appOpenLoaded = false;
}

export function loadAppOpen(): void {
  setupAppOpen();
}

export function showAppOpen(): void {
  const now = Date.now();
  if (!appOpenLoaded || !appOpen || appOpenShowing) return;
  if (now - lastAppOpenTime < APP_OPEN_COOLDOWN_MS) return;
  appOpenShowing = true;
  appOpen.show();
}
