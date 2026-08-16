import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

// On Android, modals rendered inside a tab stack still show the tab bar,
// so the tab bar owns the bottom inset. Strip 'bottom' from SafeAreaView
// edges on Android to avoid double-applying the system nav inset.
function resolveEdges(edges: Edge[]): Edge[] {
  if (Platform.OS === 'android') return edges.filter(e => e !== 'bottom') as Edge[];
  return edges;
}

interface ScreenProps {
  /** Body content (a FlatList, ScrollView, or plain View). */
  children: React.ReactNode;
  /** Header region — usually a <ScreenHeader />. */
  header?: React.ReactNode;
  /** Footer region — a persistent CTA. Omit when the screen has no standing action. */
  footer?: React.ReactNode;
  /**
   * Safe-area edges. Defaults to top only (Library screens are tab-hosted; the
   * tab bar owns the bottom inset). Modal-presented screens pass ['top','bottom'].
   */
  edges?: Edge[];
  /** Wrap body+footer in a KeyboardAvoidingView so a pinned footer rises with the keyboard. */
  keyboardAvoiding?: boolean;
  /** Extra style for the body wrapper. */
  bodyStyle?: ViewStyle;
}

/** Canonical Header → Body → Footer screen frame, themed. */
export function Screen({ children, header, footer, edges = ['top'], keyboardAvoiding, bodyStyle }: ScreenProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <View style={[styles.body, bodyStyle]}>{children}</View>
      {footer}
    </>
  );

  return (
    <SafeAreaView edges={resolveEdges(edges)} style={[styles.safe, { backgroundColor: colors.background }]}>
      {header}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  body: { flex: 1 },
});
