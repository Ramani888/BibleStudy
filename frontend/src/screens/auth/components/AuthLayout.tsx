import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparklesIcon } from '../../../components/icons';
import { Divider, Typography } from '../../../components/ui';
import { type Theme, useTheme } from '../../../theme';
import { SocialButtons } from './SocialButtons';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Pass handlers to show social buttons + "or" divider. Omit on OTP / reset screens. */
  onGoogle?: () => void;
  onApple?: () => void;
  socialLoading?: 'google' | 'apple' | null;
}

function BrandLogo({ colors, spacing, layout }: Pick<Theme, 'colors' | 'spacing' | 'layout'>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2.5], marginBottom: spacing[8] }}>
      <View style={{ width: spacing[10], height: spacing[10], borderRadius: layout.cardRadius, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
        <SparklesIcon size={26} color={colors.textOnPrimary} />
      </View>
      <Typography preset="h4" color={colors.primary} style={{ letterSpacing: 0.3 }}>
        BibleStudy Pro
      </Typography>
    </View>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  onGoogle,
  onApple,
  socialLoading,
}: AuthLayoutProps) {
  const { colors, spacing, layout } = useTheme();
  const styles = makeStyles({ colors, spacing, layout });
  const hasSocial = !!(onGoogle && onApple);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo colors={colors} spacing={spacing} layout={layout} />

          <Typography preset="h2" style={styles.title}>{title}</Typography>
          {subtitle && (
            <Typography preset="body" color={colors.textSecondary} style={styles.subtitle}>
              {subtitle}
            </Typography>
          )}

          <View style={styles.form}>{children}</View>

          {hasSocial && (
            <>
              <View style={styles.dividerRow}>
                <Divider style={styles.dividerLine} />
                <Typography preset="bodySm" color={colors.textSecondary} style={styles.orText}>
                  or
                </Typography>
                <Divider style={styles.dividerLine} />
              </View>

              <SocialButtons
                onGoogle={onGoogle!}
                onApple={onApple!}
                loading={socialLoading}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = ({ colors, spacing, layout }: Pick<Theme, 'colors' | 'spacing' | 'layout'>) =>
  StyleSheet.create({
    safe:   { flex: 1, backgroundColor: colors.background },
    kav:    { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPaddingH,
      paddingTop: spacing[6],
      paddingBottom: spacing[4],
    },
    title:    { marginBottom: spacing[1] },
    subtitle: { marginBottom: spacing[6] },
    form:     { gap: spacing[4], marginBottom: spacing[6] },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginBottom: spacing[4],
    },
    dividerLine: { flex: 1 },
    orText:      { lineHeight: 18 },
    footer: {
      paddingHorizontal: layout.screenPaddingH,
      paddingBottom: spacing[4],
      paddingTop: spacing[3],
      gap: spacing[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
