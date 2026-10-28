import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import {
  QMBackButton, QMMenuGroup, QMMenuRow, QMSegmented, QMSheet, QMSwitchRow, type QMSheetAction,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { GlobeIcon, InfoIcon, LeafIcon, MoonIcon, PhoneIcon, SunIcon } from '../../components/icons';
import { useAuthStore, useAnalyticsStore } from '../../store';
import { useBlockedUsers, useUpdateProfile, useTabBarSpace } from '../../hooks';
import { getErrorMessage } from '../../api';
import { storage } from '../../utils/storage';
import { APP_VERSION } from '../../constants';
import { radius, spacing, useTheme, useThemeStore, type ThemeMode } from '../../theme';
import { useLanguageStore, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import type { ProfileScreenProps } from '../../navigation/types';

const TERMS_URL = 'https://getverdance.com/terms.html';
const BTN_H = 52;
const SHEET_TOP = 18;

type Sheet = 'lang' | 'out' | 'delete' | null;

export function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [deleting, setDeleting] = useState(false);

  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const useFsrs = useAuthStore(s => s.user?.useFsrs ?? false);
  const updateProfile = useUpdateProfile();
  const analyticsEnabled = useAnalyticsStore(s => s.enabled);
  const setAnalyticsEnabled = useAnalyticsStore(s => s.setEnabled);
  const mode = useThemeStore(s => s.mode);
  const setMode = useThemeStore(s => s.setMode);
  const currentLang = useLanguageStore(s => s.language);
  const setLanguage = useLanguageStore(s => s.setLanguage);
  const { data: blocked } = useBlockedUsers();

  // AI helper = the stored AI-data consent. Off clears it, so Ask / AI quizzes ask again first.
  const [aiOn, setAiOn] = useState(false);
  useFocusEffect(useCallback(() => {
    storage.getAiPolicyAccepted().then(setAiOn).catch(() => {});
  }, []));
  const toggleAi = useCallback((v: boolean) => {
    setAiOn(v);
    (v ? storage.setAiPolicyAccepted() : storage.clearAiPolicyAccepted()).catch(() => setAiOn(!v));
  }, []);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      Toast.show({ type: 'success', text1: t('profile:qmSettings.deleted') });
    } catch (err) {
      setDeleting(false);
      setSheet(null);
      Toast.show({ type: 'error', text1: t('profile:qmSettings.deleteFailed'), text2: getErrorMessage(err) });
    }
  }, [deleteAccount, t]);

  const close = useCallback(() => { if (!deleting) setSheet(null); }, [deleting]);

  const langActions: QMSheetAction[] = Object.values(SUPPORTED_LANGUAGES).map(l => ({
    label: l.nativeName,
    sub: l.name !== l.nativeName ? l.name : undefined,
    icon: GlobeIcon,
    tick: l.code === currentLang,
    onPress: () => { setLanguage(l.code as SupportedLanguage); },
  }));

  const themes: { key: ThemeMode; label: string; icon: typeof SunIcon }[] = [
    { key: 'light', label: t('profile:qmSettings.themeLight'), icon: SunIcon },
    { key: 'dark', label: t('profile:qmSettings.themeDark'), icon: MoonIcon },
    { key: 'system', label: t('profile:qmSettings.themePhone'), icon: PhoneIcon },
  ];

  const blockedCount = blocked?.length ?? 0;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl + tabSpace }]} showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmSettings.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmSettings.title')}</Typography>

        <QMMenuGroup label={t('profile:qmSettings.appearance')} index={0}>
          <Typography preset="qmRow" color={qm.ink} style={styles.themeLabel}>{t('profile:qmSettings.theme')}</Typography>
          <QMSegmented options={themes} value={mode} onChange={setMode} label={t('profile:qmSettings.theme')} />
          <View style={styles.themeGap} />
          <QMMenuRow
            label={t('profile:qmSettings.language')}
            value={SUPPORTED_LANGUAGES[currentLang]?.nativeName ?? 'English'}
            onPress={() => setSheet('lang')}
          />
        </QMMenuGroup>

        <QMMenuGroup label={t('profile:qmSettings.study')} index={1}>
          <QMSwitchRow
            first
            label={t('profile:qmSettings.smartScheduling')}
            hint={t('profile:qmSettings.smartSchedulingHint')}
            value={useFsrs}
            onChange={v => updateProfile.mutate({ useFsrs: v })}
          />
          <QMSwitchRow
            label={t('profile:qmSettings.aiHelper')}
            hint={aiOn ? t('profile:qmSettings.aiOnHint') : t('profile:qmSettings.aiOffHint')}
            tag={t('profile:qmSettings.newTag')}
            value={aiOn}
            onChange={toggleAi}
          />
        </QMMenuGroup>

        <QMMenuGroup label={t('profile:qmSettings.notifPrivacy')} index={2}>
          <QMMenuRow first label={t('profile:qmSettings.notificationChoices')} onPress={() => navigation.navigate('NotificationSettings')} />
          <QMMenuRow
            label={t('profile:qmSettings.blocked')}
            value={blockedCount > 0 ? String(blockedCount) : undefined}
            onPress={() => navigation.navigate('BlockedUsers')}
          />
          <QMSwitchRow
            label={t('profile:qmSettings.usage')}
            hint={t('profile:qmSettings.usageHint')}
            value={analyticsEnabled}
            onChange={setAnalyticsEnabled}
          />
        </QMMenuGroup>

        <QMMenuGroup label={t('profile:qmSettings.about')} index={3}>
          <QMMenuRow first label={t('profile:qmSettings.aboutVerdance')} onPress={() => navigation.navigate('AboutUs')} />
          <QMMenuRow label={t('profile:qmSettings.privacy')} onPress={() => navigation.navigate('PrivacyPolicy')} />
          <QMMenuRow label={t('profile:qmSettings.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
        </QMMenuGroup>

        <QMMenuGroup index={4} style={styles.endGroup}>
          <QMMenuRow first chevron={false} label={t('profile:qmSettings.signOut')} onPress={() => setSheet('out')} />
          <QMMenuRow chevron={false} danger label={t('profile:qmSettings.deleteAccount')} onPress={() => setSheet('delete')} />
        </QMMenuGroup>

        <View style={styles.footer}>
          <LeafIcon size={22} color={qm.leaf} />
          <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.footerLine}>
            {t('profile:qmSettings.version', { version: APP_VERSION })}
          </Typography>
          <Typography preset="qmMeta" color={qm.muted} align="center">{t('profile:qmSettings.madeWithCare')}</Typography>
        </View>
      </ScrollView>

      <QMSheet visible={sheet === 'lang'} onClose={close} title={t('profile:qmSettings.language')} actions={langActions} />

      <QMSheet visible={sheet === 'out'} onClose={close} title={t('profile:qmSettings.signOutTitle')}>
        <Typography preset="qmBodyMd" color={qm.body}>{t('profile:qmSettings.signOutText')}</Typography>
        <View style={styles.btnRow}>
          <AnimatedPressable scaleTo={0.97} onPress={close} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
            <Typography preset="qmButton" color={qm.ink}>{t('profile:qmSettings.stay')}</Typography>
          </AnimatedPressable>
          <AnimatedPressable scaleTo={0.97} onPress={logout} style={[styles.btn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
            <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmSettings.signOut')}</Typography>
          </AnimatedPressable>
        </View>
      </QMSheet>

      <QMSheet visible={sheet === 'delete'} onClose={close} title={t('profile:qmSettings.deleteTitle')}>
        <Typography preset="qmBodyMd" color={qm.body}>{t('profile:qmSettings.deleteIntro')}</Typography>
        {(['deleteItem1', 'deleteItem2', 'deleteItem3'] as const).map(k => (
          <View key={k} style={styles.bullet}>
            <Typography preset="qmBodyMd" color={qm.body}>{'•'}</Typography>
            <Typography preset="qmBodyMd" color={qm.body} style={styles.flex}>{t(`profile:qmSettings.${k}`)}</Typography>
          </View>
        ))}
        <View style={[styles.note, { backgroundColor: qm.goldBg }]}>
          <InfoIcon size={18} color={qm.goldText} />
          <Typography preset="qmBody" color={qm.goldText} style={styles.flex}>{t('profile:qmSettings.deleteSubs')}</Typography>
        </View>
        <View style={styles.btnRow}>
          <AnimatedPressable scaleTo={0.97} disabled={deleting} onPress={close} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
            <Typography preset="qmButton" color={qm.ink}>{t('profile:qmSettings.keepAccount')}</Typography>
          </AnimatedPressable>
          <AnimatedPressable
            scaleTo={0.97}
            disabled={deleting}
            onPress={handleDelete}
            style={[styles.btn, { backgroundColor: qm.errorBg }]}
            accessibilityRole="button"
            accessibilityState={{ busy: deleting }}
          >
            {deleting
              ? <ActivityIndicator size="small" color={qm.error} />
              : <Typography preset="qmButton" color={qm.error}>{t('profile:qmSettings.deleteForever')}</Typography>}
          </AnimatedPressable>
        </View>
      </QMSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  themeLabel: { marginTop: spacing.s14, marginBottom: spacing.s10 },
  themeGap: { height: spacing.s10 },
  endGroup: { marginTop: spacing.s22 },
  footer: { alignItems: 'center', marginTop: spacing.xxl },
  footerLine: { marginTop: spacing.s6 },
  btnRow: { flexDirection: 'row', gap: spacing.s10, marginTop: SHEET_TOP },
  btn: { flex: 1, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  bullet: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs, marginTop: spacing.xs },
  note: { flexDirection: 'row', gap: spacing.s10, padding: spacing.md, borderRadius: radius.r12 + 2, marginTop: spacing.md },
});
