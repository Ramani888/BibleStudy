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
export function OfflineBanner() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(
    () => NetInfo.addEventListener(state => setOffline(state.isConnected === false)),
    [],
  );

  if (!offline) return null;

  return (
    <View style={[styles.bar, { backgroundColor: colors.warning, paddingTop: insets.top + spacing.xs }]}>
      <Typography preset="caption" align="center" color={colors.textOnAccent}>
        {t('common:status.offline', 'You appear to be offline')}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
