import React, { useState } from 'react';
import { ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../adIds';

interface AdBannerProps {
  style?: ViewStyle;
}

export function AdBanner({ style }: AdBannerProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <BannerAd
      unitId={AD_UNIT_IDS.banner}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      onAdFailedToLoad={() => setFailed(true)}
      {...(style ? { style } : {})}
    />
  );
}
