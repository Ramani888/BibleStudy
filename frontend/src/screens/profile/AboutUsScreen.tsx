import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import type { ProfileScreenProps } from '../../navigation/types';
import { Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { radius, spacing, useTheme } from '../../theme';

const APP_VERSION = '1.0.0';

export function AboutUsScreen({ navigation }: ProfileScreenProps<'AboutUs'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} header={<ScreenHeader title={t('profile:settings.aboutUs')} onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Typography preset="h2" color={colors.textPrimary} style={styles.appName}>
            {t('common:appName', 'BibleStudy Pro')}
          </Typography>
          <Typography preset="caption" color={colors.textSecondary} style={styles.version}>
            {t('profile:settings.versionLabel', { version: APP_VERSION, defaultValue: `Version ${APP_VERSION}` })}
          </Typography>
          <Typography preset="body" color={colors.textSecondary} style={styles.description}>
            {t('profile:aboutUs.description', "BibleStudy Pro helps you deepen your understanding of Scripture through AI-powered flashcards, spaced repetition, and collaborative study tools. Whether you study alone or in a group, we're here to make every session more meaningful.")}
          </Typography>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Typography preset="label" color={colors.textPrimary} style={styles.sectionTitle}>
            {t('profile:aboutUs.missionTitle', 'Our Mission')}
          </Typography>
          <Typography preset="body" color={colors.textSecondary}>
            {t('profile:aboutUs.missionBody', 'To make Bible study accessible, effective, and joyful for believers everywhere — combining timeless wisdom with modern learning science.')}
          </Typography>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Typography preset="label" color={colors.textPrimary} style={styles.sectionTitle}>
            {t('profile:aboutUs.contactTitle', 'Contact')}
          </Typography>
          <Typography preset="body" color={colors.textSecondary}>
            {t('profile:aboutUs.contactIntro', 'Questions or feedback? Reach us at')}{'\n'}
            <Typography preset="body" color={colors.accent}>ddtechservices.work@gmail.com</Typography>
          </Typography>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.s14, paddingBottom: spacing.s48 },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  appName: { textAlign: 'center' },
  version: { textAlign: 'center' },
  description: { marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  sectionTitle: { marginBottom: spacing.xs },
});
