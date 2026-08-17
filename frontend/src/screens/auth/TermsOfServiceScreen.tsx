import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { radius, spacing, useTheme } from '../../theme';

const LAST_UPDATED = 'August 2026';

function Section({ title, body }: { title: string; body: string }) {
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

export function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <Screen edges={['top']} header={<ScreenHeader title="Terms of Service" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Typography preset="caption" color={colors.textSecondary} style={styles.updated}>
          Last updated: {LAST_UPDATED}
        </Typography>

        <Section
          title="Acceptance of Terms"
          body="By creating an account or using BibleStudy Pro, you agree to these Terms of Service. If you do not agree, please do not use the app."
        />

        <Section
          title="Use of the App"
          body="BibleStudy Pro is a personal Bible study tool. You may use it only for lawful purposes. You must not use the app to generate, store, or share content that is illegal, harmful, or violates the rights of others."
        />

        <Section
          title="AI Chat"
          body="The AI chat feature sends your messages to third-party AI providers (OpenRouter and Anthropic Claude) to generate responses. AI-generated content is for study and informational purposes only and does not constitute theological, legal, medical, or professional advice."
        />

        <Section
          title="Credits & Subscriptions"
          body="AI features consume credits. Credits are non-refundable once used. Subscriptions are billed through Apple In-App Purchase and are subject to Apple's refund policy. We do not process payments directly."
        />

        <Section
          title="Your Content"
          body="You retain ownership of the flashcards, notes, and study plans you create. By using BibleStudy Pro, you grant us a limited license to store and process your content solely to provide the service to you."
        />

        <Section
          title="Account Termination"
          body="We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from Settings → Delete Account."
        />

        <Section
          title="Disclaimer of Warranties"
          body="BibleStudy Pro is provided 'as is' without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that AI responses will be accurate or complete."
        />

        <Section
          title="Contact"
          body={"For questions about these terms, contact us at:\nddtechservices.work@gmail.com"}
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
