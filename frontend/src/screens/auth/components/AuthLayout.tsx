import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../../theme';
import { Typography } from '../../../components/ui';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function BrandLogo() {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.logoMark}>
        <Typography preset="h3" color={colors.textOnPrimary} align="center">
          ✦
        </Typography>
      </View>
      <Typography preset="h4" color={colors.primary} style={styles.logoText}>
        BibleStudy Pro
      </Typography>
    </View>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <SafeAreaView style={styles.safe}>
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

          <View style={styles.card}>
            <Typography preset="h2" style={styles.title}>
              {title}
            </Typography>
            {subtitle && (
              <Typography preset="body" color={colors.textSecondary} style={styles.subtitle}>
                {subtitle}
              </Typography>
            )}
            <View style={styles.form}>{children}</View>
          </View>

          {footer && <View style={styles.footer}>{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[6],
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: spacing[1],
  },
  subtitle: {
    marginBottom: spacing[5],
  },
  form: {
    gap: spacing[4],
    marginTop: spacing[4],
  },
  footer: {
    marginTop: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
  },
});
