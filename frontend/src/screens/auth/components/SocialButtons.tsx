import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui';
import { useTheme, spacing, layout } from '../../../theme';

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="g">
          <Rect width={48} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#g)">
        <Path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
        <Path d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00"/>
        <Path d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.7 35.9 27 37 24 37c-6 0-10.7-3.9-11.8-9.3l-7 5.4C8.4 40.6 15.6 45 24 45z" fill="#4CAF50"/>
        <Path d="M44.5 20H24v8.5h11.8c-.6 2.9-2.3 5.3-4.7 7l6.6 5.6C41.5 37.7 45 31.4 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
      </G>
    </Svg>
  );
}

function AppleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 814 1000">
      <Path
        fill={color}
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.3 134.4-316.7 266.4-316.7 87.1 0 158.7 55.3 212.8 55.3 48.4 0 132.9-58.9 227.5-58.9 35.5 0 154.2 3.2 230.4 148.6zM549.5 163.2c23.4-27.7 40.2-66.2 40.2-104.7 0-5.5-.5-11-1.6-15.5-38.4 1.4-84.1 26.3-111.4 57.6-21.4 24.6-41.2 63.2-41.2 101.7 0 6 1 12 1.5 14.1 2.5.4 6.6 1 10.7 1 34.4 0 77.1-23.5 101.8-54.2z"
      />
    </Svg>
  );
}

interface Props {
  onGoogle: () => void;
  onApple: () => void;
  loading?: 'google' | 'apple' | null;
}

export const SocialButtons = React.memo(function SocialButtons({ onGoogle, onApple, loading }: Props) {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {/* Google */}
      <Pressable
        style={({ pressed }) => [styles.btn, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}
        onPress={onGoogle}
        disabled={!!loading}
        accessibilityRole="button"
        accessibilityLabel={t('social.google')}
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <>
            <GoogleIcon />
            <Typography preset="label" style={styles.label}>{t('social.google')}</Typography>
          </>
        )}
      </Pressable>

      {/* Apple — iOS only */}
      {Platform.OS === 'ios' && (
        <Pressable
          style={({ pressed }) => [styles.btn, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}
          onPress={onApple}
          disabled={!!loading}
          accessibilityRole="button"
          accessibilityLabel={t('social.apple')}
        >
          {loading === 'apple' ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <AppleIcon color={colors.textPrimary} />
              <Typography preset="label" style={styles.label}>{t('social.apple')}</Typography>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
});

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
