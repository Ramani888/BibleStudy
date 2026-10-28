import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import { spacing, useTheme } from '../../theme';
import { Typography } from '../ui';

// App-wide bar shown only while the device is offline. Cached sets/cards still
// render underneath (see lib/queryClient persister); this just makes gaps read
// as "offline" rather than "broken".
const SHOW_DELAY_MS = 1500;

export function OfflineBanner() {
  const { t } = useTranslation('common');
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  // The banner takes layout space, so wait out short network blips before showing it.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = NetInfo.addEventListener(state => {
      if (timer) clearTimeout(timer);
      if (state.isConnected === false) timer = setTimeout(() => setOffline(true), SHOW_DELAY_MS);
      else setOffline(false);
    });
    return () => { if (timer) clearTimeout(timer); unsubscribe(); };
  }, []);

  if (!offline) return null;

  return (
    <View style={[styles.bar, { backgroundColor: qm.goldBg, paddingTop: insets.top + spacing.xs }]}>
      <Typography preset="caption" align="center" color={qm.goldText}>
        {t('common:status.offline', 'You appear to be offline')}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
