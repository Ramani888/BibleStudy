import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { radius, spacing, useTheme } from '../../theme';

const LAST_UPDATED = 'August 2026';

interface SectionProps {
  title: string;
  body: string;
}

function Section({ title, body }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Typography preset="label" color={colors.textPrimary} style={styles.sectionTitle}>
        {title}
      </Typography>
      <Typography preset="body" color={colors.textSecondary} style={styles.body}>
        {body}
      </Typography>
    </View>
  );
}

export function PrivacyPolicyScreen() {
  const { t } = useTranslation(['profile', 'common']);
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <Screen edges={['top']} header={<ScreenHeader title={t('profile:settings.privacyPolicy')} onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Typography preset="caption" color={colors.textSecondary} style={styles.updated}>
          {t('profile:legal.lastUpdated', { date: LAST_UPDATED, defaultValue: `Last updated: ${LAST_UPDATED}` })}
        </Typography>

        <Section
          title={t('profile:legal.privacySec1Title', 'Information We Collect')}
          body={t('profile:legal.privacySec1Body', 'We collect your name, email address, and the content you create (flashcard sets, notes, and study plans) to provide our service. We also collect anonymous usage analytics to improve the app.')}
        />

        <Section
          title={t('profile:legal.privacySec2Title', 'How We Use Your Data')}
          body={t('profile:legal.privacySec2Body', "Your data is used solely to deliver BibleStudy Pro's features — generating AI responses, syncing your study progress, and enabling social features like friend leaderboards. We never sell your personal information.")}
        />

        <Section
          title={t('profile:legal.privacySec3Title', 'AI Processing')}
          body={t('profile:legal.privacySec3Body', 'Text you send to the AI chat is processed by third-party AI providers (OpenRouter / Anthropic Claude) to generate responses. Media files (images, PDFs) are sent to Anthropic Claude for analysis. These providers operate under their own privacy policies.')}
        />

        <Section
          title={t('profile:legal.privacySec4Title', 'Data Storage')}
          body={t('profile:legal.privacySec4Body', 'Your data is stored securely on our servers. Passwords are hashed and never stored in plain text. We use industry-standard encryption for data in transit (TLS) and at rest.')}
        />

        <Section
          title={t('profile:legal.privacySec5Title', 'Data Retention & Deletion')}
          body={t('profile:legal.privacySec5Body', 'You can delete your account at any time from Settings → Delete Account. This permanently removes all your personal data, sets, cards, notes, and media within 30 days.')}
        />

        <Section
          title={t('profile:legal.privacySec6Title', 'Third-Party Services')}
          body={t('profile:legal.privacySec6Body', 'We use Apple In-App Purchase for subscriptions, Firebase Cloud Messaging for push notifications, and AI providers for chat features. Each service has its own privacy policy governing how they handle data.')}
        />

        <Section
          title={t('profile:legal.privacySec7Title', 'Contact Us')}
          body={t('profile:legal.privacySec7Body', "For privacy-related questions or data requests, contact us at:\nddtechservices.work@gmail.com")}
        />

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.s14, paddingBottom: spacing.s48 },
  updated: { textAlign: 'center', marginBottom: spacing.xs },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: { marginBottom: spacing.xs },
  body: { lineHeight: 22 },
});
