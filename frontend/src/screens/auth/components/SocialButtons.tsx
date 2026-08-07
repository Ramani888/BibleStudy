import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '../../../components/ui';
import { type Theme, useTheme } from '../../../theme';

// Inline SVG-style Google 'G' logo as a Unicode character is not enough — use a minimal SVG path
function GoogleIcon() {
  return (
    <Typography preset="label" style={{ fontSize: 15, lineHeight: 18 }}>{'G'}</Typography>
  );
}

function AppleIcon({ color }: { color: string }) {
  return (
    <Typography preset="label" color={color} style={{ fontSize: 17, lineHeight: 18 }}>{'\u{F8FF}'}</Typography>
  );
}

interface Props {
  onGoogle: () => void;
  onApple: () => void;
  loading?: 'google' | 'apple' | null;
}

export function SocialButtons({ onGoogle, onApple, loading }: Props) {
  const { colors, spacing, layout } = useTheme();
  const styles = makeStyles({ colors, spacing, layout });

  return (
    <View style={styles.row}>
      {/* Google */}
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
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
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
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

const makeStyles = ({ colors, spacing, layout }: Pick<Theme, 'colors' | 'spacing' | 'layout'>) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing[3] },
    btn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      height: layout.buttonHeight,
      borderRadius: layout.cardRadius,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pressed: { opacity: 0.7 },
    label: { letterSpacing: 0.2 },
  });
