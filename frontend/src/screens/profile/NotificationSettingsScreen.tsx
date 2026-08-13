import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Switch } from '../../components/ui/Switch';
import { Typography } from '../../components/ui/Typography';
import { CARD_FILL_LIGHT, spacing, radius, useTheme } from '../../theme';
import { layout } from '../../constants/layout';
import type { ProfileScreenProps } from '../../navigation/types';

const STORAGE_KEY = '@bsp/notification_settings';

interface NotificationPrefs {
  friendRequests: boolean;
  friendAccepted: boolean;
  achievements:   boolean;
  system:         boolean;
}

const DEFAULTS: NotificationPrefs = {
  friendRequests: true,
  friendAccepted: true,
  achievements:   true,
  system:         true,
};

const SETTINGS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'friendRequests', label: 'Friend Requests',  description: 'When someone sends you a friend request' },
  { key: 'friendAccepted', label: 'Friend Accepted',  description: 'When someone accepts your friend request' },
  { key: 'achievements',   label: 'Achievements',     description: 'When you unlock a new achievement' },
  { key: 'system',         label: 'System',           description: 'App announcements and important updates' },
];

function PreferenceCard({
  title, description, value, onToggle, isDark,
}: {
  title: string; description: string; value: boolean; onToggle: () => void; isDark: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[
      styles.card,
      { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
      !isDark && styles.cardShadow,
    ]}>
      <View style={styles.cardText}>
        <Typography preset="label" color={colors.textPrimary}>{title}</Typography>
        <Typography preset="caption" color={colors.textSecondary} style={styles.cardSub}>{description}</Typography>
      </View>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

export function NotificationSettingsScreen({ navigation }: ProfileScreenProps<'NotificationSettings'>) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    });
  }, []);

  const toggle = async (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <Screen edges={['top']} header={<ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Typography preset="caption" color={theme.colors.textSecondary} style={styles.hint}>
          Choose which notifications you'd like to receive.
        </Typography>
        <View style={styles.list}>
          {SETTINGS.map(s => (
            <PreferenceCard
              key={s.key}
              title={s.label}
              description={s.description}
              value={prefs[s.key]}
              onToggle={() => toggle(s.key)}
              isDark={isDark}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.s48,
  },
  hint: { marginBottom: spacing.xl },
  list: { gap: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s18,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardText: { flex: 1 },
  cardSub: { marginTop: spacing.xs },
});
