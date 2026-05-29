import { Platform } from 'react-native';

const TEST = __DEV__;

export const AD_UNIT_IDS = {
  banner: Platform.select({
    android: TEST ? 'ca-app-pub-3940256099942544/6300978111' : 'YOUR_ANDROID_BANNER_ID',
    ios:     TEST ? 'ca-app-pub-3940256099942544/2934735716' : 'YOUR_IOS_BANNER_ID',
    default: '',
  })!,
  interstitial: Platform.select({
    android: TEST ? 'ca-app-pub-3940256099942544/1033173712' : 'YOUR_ANDROID_INTERSTITIAL_ID',
    ios:     TEST ? 'ca-app-pub-3940256099942544/4411468910' : 'YOUR_IOS_INTERSTITIAL_ID',
    default: '',
  })!,
  rewarded: Platform.select({
    android: TEST ? 'ca-app-pub-3940256099942544/5224354917' : 'YOUR_ANDROID_REWARDED_ID',
    ios:     TEST ? 'ca-app-pub-3940256099942544/1712485313' : 'YOUR_IOS_REWARDED_ID',
    default: '',
  })!,
  appOpen: Platform.select({
    android: TEST ? 'ca-app-pub-3940256099942544/9257395921' : 'YOUR_ANDROID_APP_OPEN_ID',
    ios:     TEST ? 'ca-app-pub-3940256099942544/5575463023' : 'YOUR_IOS_APP_OPEN_ID',
    default: '',
  })!,
};
