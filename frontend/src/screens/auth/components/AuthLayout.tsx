import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QMFog } from '../../../components/qm';
import { useTheme, spacing } from '../../../theme';

const FOG_H = 460; // canvas auth fog height

/**
 * Quiet-morning auth shell: warm page + top fog, one scrolling column, keyboard-aware.
 * Screens compose their own header/content (logo or back arrow, title, form, links).
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { qm } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: qm.bg }]}>
      <QMFog height={FOG_H} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.huge },
});
