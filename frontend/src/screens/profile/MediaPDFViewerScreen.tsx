import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Pdf from 'react-native-pdf';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { QMButton } from '../../components/qm';
import { Typography } from '../../components/ui';
import { CloseIcon, InfoIcon, ShareUpIcon } from '../../components/icons';
import { palette, qmDark, radius, spacing } from '../../theme';

type Props = ProfileScreenProps<'MediaPDFViewer'>;

const TOUCH = 44;
const ERR_TILE_W = 64;
const ERR_TILE_H = 76;
// The reader is always the dark view (like the photo viewer), whatever the app theme.
const READER_BG = '#0E0C13';
const GLASS_BTN = 'rgba(255,255,255,0.14)';
const PILL_BG = 'rgba(34,30,51,0.78)';

// Renders natively on-device (react-native-pdf) — the PDF is fetched + cached locally,
// so private media is never handed to a third-party viewer (e.g. Google Docs).
export function MediaPDFViewerScreen({ route, navigation }: Props) {
  const { t } = useTranslation('profile');
  const insets = useSafeAreaInsets();
  const { url, name } = route.params;
  const qm = qmDark;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [page, setPage] = useState({ n: 1, total: 0 });

  const topBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm, backgroundColor: qm.glass, borderBottomColor: qm.hair }]}>
      <Pressable onPress={navigation.goBack} hitSlop={6} style={({ pressed }) => [styles.btn, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('qmViewer.close')}>
        <CloseIcon size={18} color={palette.white} strokeWidth={2} />
      </Pressable>
      <Typography preset="qmSegment" color={qm.ink} numberOfLines={1} style={styles.flex}>{name}</Typography>
      {!error && (
        <Pressable
          onPress={() => Share.share({ title: name, message: url, url }).catch(() => {})}
          hitSlop={6}
          style={({ pressed }) => [styles.btn, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('qmViewer.share')}
        >
          <ShareUpIcon size={19} color={palette.white} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={[styles.flex, { backgroundColor: READER_BG }]}>
        {topBar}
        <View style={styles.errorBody}>
          <View style={[styles.errTile, { backgroundColor: qm.errorBg }]}>
            <InfoIcon size={28} color={qm.warm} />
          </View>
          <Typography preset="qmEmptyTitle" color={qm.ink} align="center" style={styles.errTitle}>{t('qmViewer.pdfError')}</Typography>
          <Typography preset="qmBodyMd" color={qm.muted} align="center">{t('qmViewer.pdfErrorText')}</Typography>
        </View>
        <View style={[styles.errActions, { paddingBottom: insets.bottom + spacing.xl }]}>
          <QMButton label={t('qmViewer.openBrowser')} onPress={() => Linking.openURL(url).catch(() => {})} />
          <Pressable onPress={navigation.goBack} style={({ pressed }) => [styles.closeLink, pressed && styles.dim]} accessibilityRole="button">
            <Typography preset="qmButtonLg" color={qm.ink}>{t('qmViewer.close')}</Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: READER_BG }]}>
      <Pdf
        key={fresh ? 'fresh' : 'cached'}
        source={{ uri: url, cache: !fresh }}
        style={[styles.pdf, { backgroundColor: READER_BG }]}
        onLoadComplete={total => { setLoading(false); setPage(p => ({ ...p, total })); }}
        onPageChanged={(n, total) => setPage({ n, total })}
        onPageSingleTap={() => setChrome(c => !c)}
        onError={() => {
          // A cut-off download stays cached and would fail forever — re-download once before giving up.
          if (fresh) setError(true);
          else { setFresh(true); setLoading(true); }
        }}
        trustAllCerts={false}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: READER_BG }]}>
          <ActivityIndicator size="large" color={qm.violet} />
        </View>
      )}
      {chrome && topBar}
      {!loading && page.total > 0 && (
        <Animated.View entering={FadeIn} pointerEvents="none" style={[styles.pillWrap, { bottom: insets.bottom + spacing.xl }]}>
          <View style={[styles.pill, { backgroundColor: PILL_BG }]}>
            <Typography preset="qmChip" color={palette.white}>{t('qmViewer.page', { n: page.n, total: page.total })}</Typography>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.5 },
  pdf: { flex: 1, width: '100%' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  btn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: GLASS_BTN, alignItems: 'center', justifyContent: 'center' },
  pillWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: { paddingVertical: spacing.s7, paddingHorizontal: spacing.s14, borderRadius: radius.pill },
  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.huge },
  errTile: { width: ERR_TILE_W, height: ERR_TILE_H, borderRadius: radius.r12, alignItems: 'center', justifyContent: 'center' },
  errTitle: { marginTop: spacing.s18, marginBottom: spacing.s6 },
  errActions: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  closeLink: { height: 52, alignItems: 'center', justifyContent: 'center' },
});
