import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Switch, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BookIcon, FileTextIcon, GlobeIcon, InfoIcon, LogOutIcon, StarOutlineIcon, TrashIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../api';
import { spacing, useTheme, useThemeStore } from '../../theme';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../../i18n';

const APP_VERSION = '1.0.0';

export function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const { colors } = theme;

  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const { show, dialogProps } = useConfirmDialog();
  const isDark = theme.name === 'dark';
  const setMode = useThemeStore(s => s.setMode);
  const currentLang = useLanguageStore(s => s.language);
  const languageName = SUPPORTED_LANGUAGES[currentLang]?.nativeName || 'English';

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
              showChevron={false}
              onPress={() => {
                Toast.show({
                  type: 'info',
                  text1: t('profile:settings.language'),
                  text2: `${languageName} is active`,
                });
              }}
            />
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
            <MenuItem icon={StarOutlineIcon} label={t('common:appName', 'BibleStudy Pro')} value={t('profile:settings.madeWithLove', 'Made with ♥')} showChevron={false} onPress={() => {}} />
            <MenuItem icon={InfoIcon} label={t('profile:settings.aboutUs')} onPress={handleNavAboutUs} />
            <MenuItem icon={FileTextIcon} label={t('profile:settings.privacyPolicy')} onPress={handleNavPrivacy} />
          </MenuSection>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
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
});
