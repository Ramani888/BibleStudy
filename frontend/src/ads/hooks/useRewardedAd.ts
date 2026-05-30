import { useCallback, useEffect, useRef, useState } from 'react';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../adIds';

interface UseRewardedAdOptions {
  onEarned: () => Promise<void>;
}

interface UseRewardedAdResult {
  show: () => void;
  isLoaded: boolean;
  isLoading: boolean;
}

export function useRewardedAd({ onEarned }: UseRewardedAdOptions): UseRewardedAdResult {
  const adRef    = useRef<RewardedAd | null>(null);
  const didEarn  = useRef(false);
  const onEarnedRef = useRef(onEarned);

  const [isLoaded,  setIsLoaded]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keep onEarned ref fresh without re-triggering loadAd
  useEffect(() => { onEarnedRef.current = onEarned; }, [onEarned]);

  const loadAd = useCallback(() => {
    setIsLoaded(false);
    setIsLoading(true);
    didEarn.current = false;

    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, { requestNonPersonalizedAdsOnly: true });

    const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
      setIsLoading(false);
    });

    const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      didEarn.current = true;
      onEarnedRef.current().catch(() => {}).finally(() => {
        u1(); u2(); u3(); u4();
        loadAd();
      });
    });

    const u3 = ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (!didEarn.current) {
        u1(); u2(); u3(); u4();
        loadAd();
      }
      // if didEarn, cleanup is handled in EARNED_REWARD finally
    });

    const u4 = ad.addAdEventListener(AdEventType.ERROR, () => {
      u1(); u2(); u3(); u4();
      setIsLoading(false);
      setIsLoaded(false);
      setTimeout(() => loadAd(), 30_000);
    });

    ad.load();
    adRef.current = ad;
  }, []);

  useEffect(() => {
    loadAd();
    // No cleanup needed — ad listeners are cleaned up in their own handlers
  }, [loadAd]);

  const show = useCallback(() => {
    if (!isLoaded || !adRef.current) return;
    adRef.current.show();
  }, [isLoaded]);

  return { show, isLoaded, isLoading };
}
