import { TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

export const AD_UNIT_IDS = {
  banner: __DEV__
    ? TestIds.BANNER
    : Platform.select({ android: 'YOUR_ANDROID_BANNER_ID', ios: 'YOUR_IOS_BANNER_ID', default: '' })!,

  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({ android: 'YOUR_ANDROID_INTERSTITIAL_ID', ios: 'YOUR_IOS_INTERSTITIAL_ID', default: '' })!,

  rewarded: __DEV__
    ? TestIds.REWARDED
    : Platform.select({ android: 'YOUR_ANDROID_REWARDED_ID', ios: 'YOUR_IOS_REWARDED_ID', default: '' })!,

  appOpen: __DEV__
    ? TestIds.APP_OPEN
    : Platform.select({ android: 'YOUR_ANDROID_APP_OPEN_ID', ios: 'YOUR_IOS_APP_OPEN_ID', default: '' })!,
};
