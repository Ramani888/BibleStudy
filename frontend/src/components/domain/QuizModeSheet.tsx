import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { useTranslation } from 'react-i18next';
import { Divider, Typography } from '../ui';
import { ChevronRightIcon, ShuffleIcon } from '../icons';
import { useCards } from '../../hooks';
import { supportedModes, MODE_META, MIN_MC_CARDS } from '../../hooks/useQuizSession';
import { layout, spacing, useTheme } from '../../theme';
import type { QuizSelectableMode } from '../../types';

interface QuizModeSheetProps {
  visible: boolean;
  setIds: string[];
  setTitles: string[];
  onClose: () => void;
  onStart: (mode: QuizSelectableMode, setIds: string[], setTitles: string[]) => void;
}

export function QuizModeSheet({ visible, setIds, setTitles, onClose, onStart }: QuizModeSheetProps) {
  const { t } = useTranslation(['quiz', 'common']);
  const { colors } = useTheme();
  const ref = useRef<BottomSheetModal>(null);
  const isOpenRef = useRef(false);

  const { data: cards = [] } = useCards(setIds[0] ?? '');
  const modes = useMemo(() => supportedModes(cards), [cards]);

  const handleDismiss = useCallback(() => {
    isOpenRef.current = false;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && !isOpenRef.current) {
      isOpenRef.current = true;
      ref.current?.present();
    } else if (!visible && isOpenRef.current) {
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleStart = useCallback((mode: QuizSelectableMode) => {
    ref.current?.dismiss();
    setTimeout(() => onStart(mode, setIds, setTitles), 300);
  }, [setIds, setTitles, onStart]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['70%']}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.accent }]}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface }]}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Typography preset="h4" style={styles.title}>{setTitles[0]}</Typography>
        <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>
          {t('quiz:setup.chooseType', 'CHOOSE A QUIZ TYPE')}
        </Typography>

        <Pressable style={({ pressed }) => [styles.row, styles.mixRow, { backgroundColor: colors.accentSoft }, pressed && styles.rowPressed]} onPress={() => handleStart('mix')}>
          <ShuffleIcon size={20} color={colors.accent} />
          <View style={styles.flex}>
            <Typography preset="h4" color={colors.accent}>{t('quiz:setup.modeMix', 'Mix')}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{t('quiz:setup.modeMixDesc', 'Random mix of all types')}</Typography>
          </View>
          <ChevronRightIcon size={18} color={colors.accent} />
        </Pressable>

        {modes.length > 0 && <Divider marginV={0} />}

        {modes.map((m, i) => (
          <React.Fragment key={m}>
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => handleStart(m)}>
              <View style={styles.flex}>
                <Typography preset="h4" color={colors.textPrimary}>{t(`quiz:modes.${m}`, MODE_META[m].label)}</Typography>
                {!MODE_META[m].scored && (
                  <Typography preset="caption" color={colors.textSecondary}>{t('quiz:setup.practiceNotScored', 'Practice · not scored')}</Typography>
                )}
              </View>
              <ChevronRightIcon size={18} color={colors.textDisabled} />
            </Pressable>
            {i < modes.length - 1 && <Divider marginV={0} />}
          </React.Fragment>
        ))}

        {cards.length > 0 && modes.length === 0 && (
          <View style={styles.empty}>
            <Typography preset="body" color={colors.textSecondary} align="center">
              {t('quiz:setup.needMinCards', { count: MIN_MC_CARDS, defaultValue: `Multiple choice needs ${MIN_MC_CARDS}+ cards of the same type.` })}
            </Typography>
          </View>
        )}

        {cards.length === 0 && (
          <View style={styles.empty}>
            <Typography preset="body" color={colors.textSecondary} align="center">
              {t('quiz:setup.addCardsToQuiz', 'Add cards to this set to start quizzing.')}
            </Typography>
          </View>
        )}

        <Divider />
        <Pressable style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]} onPress={() => ref.current?.dismiss()}>
          <Typography preset="bodyLg" color={colors.textSecondary} align="center">{t('common:actions.cancel')}</Typography>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: layout.cardRadiusSm,
    borderTopRightRadius: layout.cardRadiusSm,
  },
  handle: { width: spacing.huge, height: spacing.xs },
  content: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.xxxl },
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  sectionLabel: { marginBottom: spacing.md },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  mixRow: {
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: { paddingVertical: spacing.xxl },
  cancel: { paddingVertical: spacing.md },
  rowPressed: { opacity: 0.7 },
  cancelPressed: { opacity: 0.85 },
});
