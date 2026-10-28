import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMBackButton, QMMenuGroup, QMSwitchRow } from '../../components/qm';
import { Typography } from '../../components/ui';
import { LeafIcon, MegaphoneIcon, PersonCheckIcon, PersonPlusIcon, type IconComponent } from '../../components/icons';
import { NOTIF_DEFAULTS, NOTIF_PREFS_KEY, type NotificationPrefs, useTabBarSpace } from '../../hooks';
import { registerDeviceToken } from '../../utils/notifications';
import { spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';

const KINDS: { key: keyof NotificationPrefs; copy: string; icon: IconComponent; tone: 'violet' | 'leaf' | 'gold' }[] = [
  { key: 'friendRequests', copy: 'friendRequests', icon: PersonPlusIcon, tone: 'violet' },
  { key: 'friendAccepted', copy: 'friendAccepted', icon: PersonCheckIcon, tone: 'violet' },
  { key: 'achievements', copy: 'achievements', icon: LeafIcon, tone: 'leaf' },
  { key: 'system', copy: 'news', icon: MegaphoneIcon, tone: 'gold' },
];

export function NotificationSettingsScreen({ navigation }: ProfileScreenProps<'NotificationSettings'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [prefs, setPrefs] = useState<NotificationPrefs>(NOTIF_DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_PREFS_KEY)
      .then(raw => { if (raw) setPrefs({ ...NOTIF_DEFAULTS, ...JSON.parse(raw) }); })
      .catch(() => setPrefs(NOTIF_DEFAULTS)); // corrupt/failed read — fall back to defaults
  }, []);

  const toggle = async (key: keyof NotificationPrefs, on: boolean) => {
    // Just-in-time OS permission: only ask when the user opts INTO notifications.
    if (on && !(await registerDeviceToken({ prompt: true }))) {
      Toast.show({
        type: 'info',
        text1: t('profile:qmNotif.offTitle'),
        text2: t('profile:qmNotif.offText'),
        onPress: () => Linking.openSettings(),
      });
      return; // don't flip on without OS permission
    }
    const updated = { ...prefs, [key]: on };
    setPrefs(updated);
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
  };

  const tint = (tone: 'violet' | 'leaf' | 'gold'): [string, string] =>
    tone === 'leaf' ? [qm.leafBg, qm.leaf] : tone === 'gold' ? [qm.goldBg, qm.goldText] : [qm.lilac, qm.link];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl + tabSpace }]} showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmSettings.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmNotif.title')}</Typography>
        <Typography preset="qmBodyMd" color={qm.muted}>{t('profile:qmNotif.sub')}</Typography>

        <QMMenuGroup label={t('profile:qmNotif.section')} style={styles.group}>
          {KINDS.map((k, i) => (
            <QMSwitchRow
              key={k.key}
              first={i === 0}
              icon={k.icon}
              tint={tint(k.tone)}
              label={t(`profile:qmNotif.${k.copy}`)}
              hint={t(`profile:qmNotif.${k.copy}Hint`)}
              value={prefs[k.key]}
              onChange={v => toggle(k.key, v)}
            />
          ))}
        </QMMenuGroup>

        <Typography preset="qmMeta" color={qm.muted} style={styles.footer}>{t('profile:qmNotif.footer')}</Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  group: { marginTop: spacing.xs },
  footer: { marginTop: spacing.s14, marginHorizontal: spacing.s6 },
});
