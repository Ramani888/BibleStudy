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
import { Typography } from '../../../components/ui';
import { type Theme, useTheme } from '../../../theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function BrandLogo({ colors }: { colors: Theme['colors'] }) {
  return (
    <View style={logoStyles.wrap}>
      <View style={[logoStyles.mark, { backgroundColor: colors.primary }]}>
        <SparklesIcon size={28} color={colors.textOnPrimary} />
      </View>
      <Typography preset="h4" color={colors.primary} style={logoStyles.text}>
        BibleStudy Pro
      </Typography>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 32, gap: 8 },
  mark: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { letterSpacing: 0.5 },
});

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { colors, spacing, layout } = useTheme();
  const styles = makeStyles({ colors, spacing, layout });

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
          <BrandLogo colors={colors} />

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

const makeStyles = ({ colors, spacing, layout }: Pick<Theme, 'colors' | 'spacing' | 'layout'>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.backgroundSecondary },
    kav:  { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[6],
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: layout.cardRadius,
      padding: spacing[6],
      borderWidth: 1,
      borderColor: colors.border,
    },
    title:    { marginBottom: spacing[1] },
    subtitle: { marginBottom: spacing[5] },
    form:     { gap: spacing[4], marginTop: spacing[4] },
    footer:   { marginTop: spacing[6], alignItems: 'center', gap: spacing[3] },
  });
