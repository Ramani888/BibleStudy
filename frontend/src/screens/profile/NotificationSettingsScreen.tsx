import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui';
import { layout, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';

const STORAGE_KEY = '@bsp/notification_settings';

interface NotificationPrefs {
  friendRequests: boolean;
  friendAccepted: boolean;
  achievements: boolean;
  system: boolean;
}

const DEFAULTS: NotificationPrefs = {
  friendRequests: true,
  friendAccepted: true,
  achievements:   true,
  system:         true,
};

const SETTINGS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'friendRequests', label: 'Friend Requests',   description: 'When someone sends you a friend request' },
  { key: 'friendAccepted', label: 'Friend Accepted',   description: 'When someone accepts your friend request' },
  { key: 'achievements',   label: 'Achievements',      description: 'When you unlock a new achievement' },
  { key: 'system',         label: 'System',            description: 'App announcements and important updates' },
];

type Props = ProfileScreenProps<'NotificationSettings'>;

export function NotificationSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
    <Screen header={<ScreenHeader title="Notification Settings" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Typography preset="caption" color={colors.textSecondary} style={styles.hint}>
          Choose which notifications you'd like to receive.
        </Typography>

        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          {SETTINGS.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <Divider marginV={0} />}
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Typography preset="label">{s.label}</Typography>
                  <Typography preset="caption" color={colors.textSecondary}>{s.description}</Typography>
                </View>
                <Switch
                  value={prefs[s.key]}
                  onValueChange={() => toggle(s.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
  hint: { marginBottom: spacing[4] },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  rowText: { flex: 1, gap: spacing[1] },
});
