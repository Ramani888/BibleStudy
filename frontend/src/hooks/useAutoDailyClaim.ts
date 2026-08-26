import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Toast from 'react-native-toast-message';
import { useClaimDailyLogin } from './useCredits';

import i18n from '../i18n';

export function useAutoDailyClaim(): void {
  const { mutate } = useClaimDailyLogin();
  const mutateRef = useRef(mutate);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    mutateRef.current = mutate;
  });

  useEffect(() => {
    const claim = () => {
      mutateRef.current(undefined, {
        onSuccess: (data) => {
          Toast.show({
            type: 'success',
            text1: i18n.t('profile:credits.dailyClaimSuccess', { count: data.transaction.amount, defaultValue: `+${data.transaction.amount} credit claimed!` }),
            text2: i18n.t('profile:credits.dailyClaimSub', 'Come back tomorrow for more.'),
          });
        },
        onError: () => {},
      });
    };

    claim();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        claim();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}
