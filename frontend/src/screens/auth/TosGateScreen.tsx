import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Spacer, Typography } from '../../components/ui';
import { spacing, useTheme } from '../../theme';

interface Props {
  onAccept: () => void;
}

export function TosGateScreen({ onAccept }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Typography preset="h3" align="center">One more step</Typography>
        <Spacer size={spacing.md} />
        <Typography preset="body" color={colors.textSecondary} align="center">
          To use BibleStudy Pro you must agree to our Terms of Service and Privacy Policy.
        </Typography>

        <Spacer size={spacing.lg} />
        <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Typography preset="caption" color={colors.textSecondary} align="center">
            By tapping Accept, you confirm you have read and agree to our Terms of Service and Privacy Policy. You can review them in Settings → About Us at any time.
          </Typography>
        </View>

        <Spacer size={spacing.xxxl} />
        <Button label="Accept & Continue" variant="primary" fullWidth onPress={onAccept} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    padding: spacing.lg,
  },
});
