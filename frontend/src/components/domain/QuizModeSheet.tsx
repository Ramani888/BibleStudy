import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { Divider, Typography } from '../ui';
import { ChevronRightIcon, ShuffleIcon } from '../icons';
import { useCards } from '../../hooks';
import { supportedModes, MODE_META, MIN_MC_CARDS } from '../../hooks/useQuizSession';
import { type Theme, useTheme } from '../../theme';
import type { QuizSelectableMode } from '../../types';

interface QuizModeSheetProps {
  visible: boolean;
  setIds: string[];
  setTitles: string[];
  onClose: () => void;
  onStart: (mode: QuizSelectableMode, setIds: string[], setTitles: string[]) => void;
}

export function QuizModeSheet({ visible, setIds, setTitles, onClose, onStart }: QuizModeSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Typography preset="h4" style={styles.title}>{setTitles[0]}</Typography>
        <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>
          CHOOSE A QUIZ TYPE
        </Typography>

        <Pressable style={[styles.row, styles.mixRow]} onPress={() => handleStart('mix')}>
          <ShuffleIcon size={20} color={colors.primary} />
          <View style={styles.flex}>
            <Typography preset="h4" color={colors.primary}>Mix</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Random mix of all types</Typography>
          </View>
          <ChevronRightIcon size={18} color={colors.primary} />
        </Pressable>

        {modes.length > 0 && <Divider marginV={0} />}

        {modes.map((m, i) => (
          <React.Fragment key={m}>
            <Pressable style={styles.row} onPress={() => handleStart(m)}>
              <View style={styles.flex}>
                <Typography preset="h4" color={colors.textPrimary}>{MODE_META[m].label}</Typography>
                {!MODE_META[m].scored && (
                  <Typography preset="caption" color={colors.textSecondary}>Practice · not scored</Typography>
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
              Multiple choice needs {MIN_MC_CARDS}+ cards of the same type.
            </Typography>
          </View>
        )}

        {cards.length === 0 && (
          <View style={styles.empty}>
            <Typography preset="body" color={colors.textSecondary} align="center">
              Add cards to this set to start quizzing.
            </Typography>
          </View>
        )}

        <Divider />
        <Pressable style={styles.cancel} onPress={() => ref.current?.dismiss()}>
          <Typography preset="bodyLg" color={colors.textSecondary} align="center">Cancel</Typography>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    background: {
      backgroundColor: colors.backgroundCard,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    handle: { backgroundColor: colors.primaryLight, width: 40, height: 4 },
    content: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[8] },
    title: { marginTop: spacing[2], marginBottom: spacing[1] },
    sectionLabel: { marginBottom: spacing[3] },
    flex: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingVertical: spacing[4],
    },
    mixRow: {
      backgroundColor: colors.primarySurface,
      borderRadius: 12,
      paddingHorizontal: spacing[3],
      marginBottom: spacing[2],
    },
    empty: { paddingVertical: spacing[6] },
    cancel: { paddingVertical: spacing[3] },
  });
