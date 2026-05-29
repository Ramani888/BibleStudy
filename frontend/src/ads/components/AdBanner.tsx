import React, { useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../adIds';

export function AdBanner() {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <BannerAd
      unitId={AD_UNIT_IDS.banner}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      onAdFailedToLoad={() => setFailed(true)}
    />
  );
}
