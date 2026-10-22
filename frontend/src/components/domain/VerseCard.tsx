import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography } from '../ui';
import { CheckIcon, PlusIcon, ShareUpIcon } from '../icons';
import { useDailyVerse } from '../../hooks/useDailyVerse';
import { useTheme, spacing, radius } from '../../theme';

const BTN = 44; // canvas button height

/** "Today's verse" — Quiet-morning daily verse with Memorize + Share. */
export function VerseCard() {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  const { verse, added, isNew, busy, memorize, share } = useDailyVerse();

  return (
    <LinearGradient
      colors={qm.verse as unknown as string[]}
      locations={[0, 0.6, 1]}
      start={{ x: 0.33, y: 0 }}
      end={{ x: 0.67, y: 1 }}
      style={[styles.card, { boxShadow: qm.verseShadow }]}
    >
      <View style={styles.labelRow}>
        <Typography preset="qmLabel" color={qm.verseLabel}>{t('verse.label')}</Typography>
        {isNew && (
          <View style={[styles.newTag, { backgroundColor: qm.goldBg }]}>
            <Typography preset="qmTag" color={qm.goldText}>{t('verse.new')}</Typography>
          </View>
        )}
      </View>
      <Typography preset="qmVerse" color={qm.verseInk} style={styles.text}>{verse.text}</Typography>
      <Typography preset="qmLink" color={qm.verseRef} style={styles.ref}>
        {verse.ref} · {t('verse.translationShort')}
      </Typography>
      <View style={styles.actions}>
        <AnimatedPressable
          scaleTo={0.97}
          onPress={memorize}
          disabled={added || busy}
          style={[styles.memorize, { backgroundColor: added ? qm.leafBg : qm.verseBtn }, busy && styles.busy]}
          accessibilityRole="button"
          accessibilityState={{ disabled: added || busy }}
        >
          {added
            ? <CheckIcon size={16} color={qm.leafText} strokeWidth={2} />
            : <PlusIcon size={16} color={qm.verseInk} strokeWidth={2} />}
          <Typography preset="qmButton" color={added ? qm.leafText : qm.verseInk}>
            {added ? t('verse.added') : t('verse.memorize')}
          </Typography>
        </AnimatedPressable>
        <AnimatedPressable
          scaleTo={0.97}
          onPress={share}
          style={[styles.share, { backgroundColor: qm.verseBtn }]}
          accessibilityRole="button"
          accessibilityLabel={t('verse.share')}
        >
          <ShareUpIcon size={19} color={qm.verseInk} strokeWidth={2} />
        </AnimatedPressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newTag: { borderRadius: radius.r5, paddingHorizontal: spacing.s5, paddingVertical: 1 }, // ponytail: canvas 1px tag padding
  text: { marginTop: spacing.s10 },
  ref: { marginTop: spacing.s10 },
  actions: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.s14 },
  memorize: {
    flex: 1, height: BTN, borderRadius: radius.pill,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s6,
  },
  share: { width: BTN, height: BTN, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  busy: { opacity: 0.6 },
});
