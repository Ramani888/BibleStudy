import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../components/ui';
import { useTheme, fontSizes, lineHeights, spacing, layout } from '../../../theme';

// Inline SVG-style Google 'G' logo as a Unicode character is not enough — use a minimal SVG path
function GoogleIcon() {
  return (
    <Typography preset="label" style={{ fontSize: fontSizes.md, lineHeight: fontSizes.md * lineHeights.tight }}>{'G'}</Typography>
  );
}

function AppleIcon({ color }: { color: string }) {
  return (
    <Typography preset="label" color={color} style={{ fontSize: fontSizes.lg, lineHeight: fontSizes.md * lineHeights.tight }}>{'\u{F8FF}'}</Typography>
  );
}

interface Props {
  onGoogle: () => void;
  onApple: () => void;
  loading?: 'google' | 'apple' | null;
}

export function SocialButtons({ onGoogle, onApple, loading }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {/* Google */}
      <Pressable
        style={({ pressed }) => [styles.btn, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}
        onPress={onGoogle}
        disabled={!!loading}
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <>
            <GoogleIcon />
            <Typography preset="label" style={styles.label}>Google</Typography>
          </>
        )}
      </Pressable>

      {/* Apple — iOS only */}
      {Platform.OS === 'ios' && (
        <Pressable
          style={({ pressed }) => [styles.btn, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}
          onPress={onApple}
          disabled={!!loading}
        >
          {loading === 'apple' ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <AppleIcon color={colors.textPrimary} />
              <Typography preset="label" style={styles.label}>Apple</Typography>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: layout.buttonHeight,
    borderRadius: layout.cardRadius,
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.7 },
  label: { letterSpacing: 0.2 },
});
