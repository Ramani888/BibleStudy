import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Spacer, Typography } from '../../components/ui';
import { SparklesIcon } from '../../components/icons';
import { spacing, useTheme } from '../../theme';
import { storage } from '../../utils/storage';
import type { AIScreenProps } from '../../navigation/types';

export function AIConsentScreen({ navigation }: AIScreenProps<'AIConsent'>) {
  const { colors } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    storage.getAiPolicyAccepted().then(accepted => {
      if (accepted) {
        navigation.replace('AIChat');
      } else {
        setChecking(false);
      }
    });
  }, [navigation]);

  const handleAccept = async () => {
    await storage.setAiPolicyAccepted();
    navigation.replace('AIChat');
  };

  const handleDecline = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  if (checking) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <SparklesIcon size={48} color={colors.accent} />
        <Spacer size={spacing.lg} />

        <Typography preset="h3" align="center">AI Chat uses external services</Typography>
        <Spacer size={spacing.sm} />
        <Typography preset="body" color={colors.textSecondary} align="center">
          Your messages are sent to third-party AI providers to generate responses:
        </Typography>

        <Spacer size={spacing.lg} />
        <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Typography preset="label">OpenRouter (Gemma)</Typography>
          <Typography preset="caption" color={colors.textSecondary}>Processes your text messages and questions</Typography>

          <Spacer size={spacing.sm} />

          <Typography preset="label">Anthropic Claude</Typography>
          <Typography preset="caption" color={colors.textSecondary}>Processes media attachments (PDFs, images)</Typography>
        </View>

        <Spacer size={spacing.md} />
        <Typography preset="caption" color={colors.textSecondary} align="center">
          Do not share personal information you would not want these services to receive. Messages are not stored by BibleStudy Pro beyond your session.
        </Typography>

        <Spacer size={spacing.xxxl} />

        <Button label="Accept & Continue" variant="primary" fullWidth onPress={handleAccept} />
        <Spacer size={spacing.sm} />
        <Button label="Decline" variant="ghost" fullWidth onPress={handleDecline} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
});
