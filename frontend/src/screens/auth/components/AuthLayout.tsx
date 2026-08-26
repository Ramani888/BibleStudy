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
import { useTheme, spacing, layout } from '../../../theme';
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

const BrandLogo = React.memo(function BrandLogo() {
  const { colors } = useTheme();
  return (
    <View style={styles.logoRow}>
      <View style={[styles.logoIcon, { backgroundColor: colors.accent }]}>
        <SparklesIcon size={26} color={colors.textOnAccent} />
      </View>
      <Typography preset="h4" color={colors.accent} style={styles.logoText}>
        BibleStudy Pro
      </Typography>
    </View>
  );
});

import { useTranslation } from 'react-i18next';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  onGoogle,
  onApple,
  socialLoading,
}: AuthLayoutProps) {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const hasSocial = !!(onGoogle && onApple);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
          <BrandLogo />

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
                  {t('auth:social.or', 'or')}
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

        <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  kav:    { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title:    { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xxl },
  form:     { gap: spacing.lg, marginBottom: spacing.xxl },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: { flex: 1 },
  orText:      { lineHeight: 18 }, // ponytail: off-grid Figma value
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, marginBottom: spacing.xxxl },
  logoIcon: {
    width: spacing.huge, height: spacing.huge, borderRadius: layout.cardRadius,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { letterSpacing: 0.3 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
