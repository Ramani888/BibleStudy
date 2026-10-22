import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Typography } from '../ui';
import { qmFont, useTheme } from '../../theme';

function initials(name?: string | null): string {
  const p = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return p.length ? (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() : '?';
}

/** Same name → same pastel, so a person keeps their colour on every screen. */
function toneOf(name: string, count: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % count;
}

/** Photo, or serif initials on a pastel circle (canvas people avatars). */
export function QMAvatar({ uri, name, size = 44 }: { uri?: string | null; name?: string | null; size?: number }) {
  const { qm } = useTheme();
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[circle, { backgroundColor: qm.field }]} accessibilityIgnoresInvertColors />;
  const bg = qm.setColors[toneOf(name ?? '', qm.setColors.length)];
  const fontSize = Math.round(size * 0.36);
  return (
    <View style={[circle, styles.center, { backgroundColor: bg }]}>
      <Typography style={[styles.text, { color: qm.onPastel, fontSize, lineHeight: Math.round(fontSize * 1.25) }]}>{initials(name)}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: qmFont.serifMedium },
});
