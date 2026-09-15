import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog, SelectSheet } from '../../components/feedback';
import { Switch, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BookIcon, FileTextIcon, GlobeIcon, InfoIcon, LogOutIcon, StarOutlineIcon, TrashIcon } from '../../components/icons';
import { useAuthStore, useAnalyticsStore } from '../../store';
import { useConfirmDialog, useUpdateProfile } from '../../hooks';
import { getErrorMessage } from '../../api';
import { spacing, useTheme, useThemeStore } from '../../theme';
import { useLanguageStore, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';

const APP_VERSION = '1.0.0';

export function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const { colors } = theme;

  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const { show, dialogProps } = useConfirmDialog();
  const isDark = theme.name === 'dark';
  const useFsrs = useAuthStore(s => s.user?.useFsrs ?? false);
  const updateProfile = useUpdateProfile();
  const handleFsrsToggle = useCallback((v: boolean) => updateProfile.mutate({ useFsrs: v }), [updateProfile]);
  const analyticsEnabled = useAnalyticsStore(s => s.enabled);
  const setAnalyticsEnabled = useAnalyticsStore(s => s.setEnabled);
  const setMode = useThemeStore(s => s.setMode);
  const currentLang = useLanguageStore(s => s.language);
  const setLanguage = useLanguageStore(s => s.setLanguage);
  const languageName = SUPPORTED_LANGUAGES[currentLang]?.nativeName || 'English';
  const [langSheetVisible, setLangSheetVisible] = useState(false);

  const languageOptions = useMemo(
    () => Object.values(SUPPORTED_LANGUAGES).map(l => ({ id: l.code, label: l.nativeName })),
    [],
  );

  const handleSelectLanguage = useCallback(
    async (id: string) => {
      setLangSheetVisible(false);
      await setLanguage(id as SupportedLanguage);
    },
    [setLanguage],
  );

  const handleSignOut = useCallback(() => {
    show({
      title: t('profile:settings.signOut'),
      message: t('profile:settings.signOutConfirm'),
      confirmLabel: t('profile:settings.signOut'),
      variant: 'danger',
      onConfirm: logout,
    });
  }, [show, logout, t]);

  const handleDeleteAccount = useCallback(() => {
    show({
      title: t('profile:settings.deleteAccount'),
      message: t('profile:settings.deleteAccountConfirm'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteAccount();
          Toast.show({ type: 'success', text1: t('profile:settings.accountDeleted', 'Account deleted') });
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteAccount, t]);

  const handleThemeToggle = useCallback((v: boolean) => setMode(v ? 'dark' : 'light'), [setMode]);
  const handleNavAboutUs = useCallback(() => navigation.navigate('AboutUs'), [navigation]);
  const handleNavPrivacy = useCallback(() => navigation.navigate('PrivacyPolicy'), [navigation]);

  return (
    <Screen edges={['top']} header={<ScreenHeader title={t('profile:settings.title')} onBack={() => navigation.goBack()} />}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <MenuSection label={t('profile:settings.appearance')}>
            <View style={styles.themeRow}>
              <Typography preset="label" color={colors.textPrimary}>{t('profile:settings.darkMode')}</Typography>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
              />
            </View>
            <MenuItem
              icon={GlobeIcon}
              label={t('profile:settings.language')}
              value={languageName}
              onPress={() => setLangSheetVisible(true)}
            />
          </MenuSection>
        </View>

        <View>
          <MenuSection label={t('profile:settings.study', 'Study')}>
            <View style={styles.themeRow}>
              <View style={styles.fsrsLabel}>
                <Typography preset="label" color={colors.textPrimary}>{t('profile:settings.smartScheduling', 'Smart scheduling (FSRS)')}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>{t('profile:settings.smartSchedulingHint', 'Fewer reviews for the same recall. Off = classic SM-2.')}</Typography>
              </View>
              <Switch value={useFsrs} onValueChange={handleFsrsToggle} />
            </View>
          </MenuSection>
        </View>

        <View>
          <MenuSection label={t('profile:settings.privacy', 'Privacy')}>
            <View style={styles.themeRow}>
              <View style={styles.fsrsLabel}>
                <Typography preset="label" color={colors.textPrimary}>{t('profile:settings.shareAnalytics', 'Share usage data')}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>{t('profile:settings.shareAnalyticsHint', 'Anonymous app-usage stats that help us improve Verdance. No ads, never shared.')}</Typography>
              </View>
              <Switch value={analyticsEnabled} onValueChange={setAnalyticsEnabled} />
            </View>
          </MenuSection>
        </View>

        <View>
          <MenuSection label={t('profile:settings.account')}>
            <MenuItem icon={LogOutIcon} label={t('profile:settings.signOut')} showChevron={false} onPress={handleSignOut} />
            <MenuItem icon={TrashIcon} label={t('profile:settings.deleteAccount')} destructive showChevron={false} onPress={handleDeleteAccount} />
          </MenuSection>
        </View>

        <View>
          <MenuSection label={t('profile:settings.appInfo')}>
            <MenuItem icon={BookIcon} label={t('profile:settings.version')} value={APP_VERSION} showChevron={false} onPress={() => {}} />
            <MenuItem icon={StarOutlineIcon} label={t('common:appName', 'Verdance')} value={t('profile:settings.madeWithLove', 'Made with ♥')} showChevron={false} onPress={() => {}} />
            <MenuItem icon={InfoIcon} label={t('profile:settings.aboutUs')} onPress={handleNavAboutUs} />
            <MenuItem icon={FileTextIcon} label={t('profile:settings.privacyPolicy')} onPress={handleNavPrivacy} />
          </MenuSection>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
      <SelectSheet
        visible={langSheetVisible}
        title={t('profile:settings.language')}
        options={languageOptions}
        selectedId={currentLang}
        searchable={false}
        onSelect={handleSelectLanguage}
        onClose={() => setLangSheetVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.s48 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s17,
    paddingHorizontal: spacing.lg,
  },
  fsrsLabel: { flex: 1, paddingRight: spacing.md, gap: spacing.xs },
});
