import React, { useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../adIds';

const RETRY_DELAY_MS = 30_000;

export function AdBanner() {
  const [key, setKey] = useState(0);

  return (
    <BannerAd
      key={key}
      unitId={AD_UNIT_IDS.banner}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      onAdFailedToLoad={() => setTimeout(() => setKey(k => k + 1), RETRY_DELAY_MS)}
    />
  );
}
