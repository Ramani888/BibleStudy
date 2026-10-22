import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Typography } from '../ui';
import { useTheme, spacing, radius } from '../../theme';

const HANDLE_W = 38;
const HANDLE_H = 5;
const SIDE_MIN = 64;
const TOUCH = 44;

/**
 * Full-screen form presented as a modal (canvas SetForm / CardForm / CreatePlan):
 * grab handle, Cancel · serif title · spacer, scrolling body, pinned bottom bar.
 */
export function QMModalScreen({ title, sub, onCancel, footer, children }: {
  title: string; sub?: string; onCancel: () => void; footer?: React.ReactNode; children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  // Modal presentation on iOS sits below the status bar already; Android is full-screen.
  const top = Platform.OS === 'ios' ? spacing.s14 : insets.top + spacing.s10;
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: top, backgroundColor: qm.glass, borderBottomColor: qm.hair }]}>
        <View style={[styles.handle, { backgroundColor: qm.line }]} />
        <View style={styles.row}>
          <Pressable onPress={onCancel} hitSlop={6} style={({ pressed }) => [styles.side, pressed && styles.dim]} accessibilityRole="button">
            <Typography preset="qmLead" color={qm.link}>{t('actions.cancel', 'Cancel')}</Typography>
          </Pressable>
          <View style={styles.titleWrap}>
            <Typography preset="qmBarTitle" color={qm.ink} numberOfLines={1} accessibilityRole="header">{title}</Typography>
            {sub ? <Typography preset="qmMeta" color={qm.muted} numberOfLines={1}>{sub}</Typography> : null}
          </View>
          <View style={styles.side} />
        </View>
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm, backgroundColor: qm.glass, borderTopColor: qm.hair }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { opacity: 0.6 },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.s10, borderBottomWidth: StyleSheet.hairlineWidth },
  handle: { alignSelf: 'center', width: HANDLE_W, height: HANDLE_H, borderRadius: radius.r3, marginBottom: spacing.s10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  side: { minWidth: SIDE_MIN, height: TOUCH, justifyContent: 'center', paddingLeft: spacing.sm },
  titleWrap: { flex: 1, minWidth: 0, alignItems: 'center' },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.s14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.s10 },
});
