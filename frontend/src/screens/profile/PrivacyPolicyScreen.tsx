import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
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

export function PrivacyPolicyScreen({ navigation }: ProfileScreenProps<'PrivacyPolicy'>) {
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} header={<ScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Typography preset="caption" color={colors.textSecondary} style={styles.updated}>
          Last updated: {LAST_UPDATED}
        </Typography>

        <Section
          title="Information We Collect"
          body="We collect your name, email address, and the content you create (flashcard sets, notes, and study plans) to provide our service. We also collect anonymous usage analytics to improve the app."
        />

        <Section
          title="How We Use Your Data"
          body="Your data is used solely to deliver BibleStudy Pro's features — generating AI responses, syncing your study progress, and enabling social features like friend leaderboards. We never sell your personal information."
        />

        <Section
          title="AI Processing"
          body="Text you send to the AI chat is processed by third-party AI providers (OpenRouter / Anthropic Claude) to generate responses. Media files (images, PDFs) are sent to Anthropic Claude for analysis. These providers operate under their own privacy policies."
        />

        <Section
          title="Data Storage"
          body="Your data is stored securely on our servers. Passwords are hashed and never stored in plain text. We use industry-standard encryption for data in transit (TLS) and at rest."
        />

        <Section
          title="Data Retention & Deletion"
          body="You can delete your account at any time from Settings → Delete Account. This permanently removes all your personal data, sets, cards, notes, and media within 30 days."
        />

        <Section
          title="Third-Party Services"
          body="We use Apple In-App Purchase for subscriptions, Firebase Cloud Messaging for push notifications, and AI providers for chat features. Each service has its own privacy policy governing how they handle data."
        />

        <Section
          title="Contact Us"
          body={"For privacy-related questions or data requests, contact us at:\nprivacy@biblestudypro.app"}
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
