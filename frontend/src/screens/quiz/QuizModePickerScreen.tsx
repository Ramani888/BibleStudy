import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { ErrorState } from '../../components/feedback';
import { Button, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChevronRightIcon, HelpCircleIcon, ShuffleIcon } from '../../components/icons';
import { useCards } from '../../hooks';
import { supportedModes, MODE_META, MIN_MC_CARDS } from '../../hooks/useQuizSession';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';
import type { QuizSelectableMode } from '../../types';

type Params = { setId: string; setTitle: string; isOwner?: boolean };

export function QuizModePickerScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ P: Params }, 'P'>>();
  const { setId, setTitle } = params;
  const { data: cards = [], isLoading, isError, error, refetch } = useCards(setId);

  const modes = supportedModes(cards);
  const start = (mode: QuizSelectableMode) =>
    navigation.navigate('Quiz', { setId, setTitle, mode });

  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <Screen header={<ScreenHeader title={setTitle} onBack={() => navigation.goBack()} titleNumberOfLines={2} />}>
      {isLoading ? (
        <View style={styles.center}>
          <Typography preset="body" color={colors.textSecondary}>Loading…</Typography>
        </View>
      ) : modes.length === 0 ? (
        <View style={styles.center}>
          <HelpCircleIcon size={48} color={colors.textDisabled} />
          <Typography preset="h4" align="center" style={styles.mt3}>No quiz available yet</Typography>
          <Typography preset="body" color={colors.textSecondary} align="center" style={styles.mt2}>
            Add cards to this set (multiple-choice needs {MIN_MC_CARDS}+ cards of a type).
          </Typography>
          <View style={styles.mt4}>
            <Button label="Go Back" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>CHOOSE A QUIZ TYPE</Typography>

          <Pressable style={[styles.row, styles.mixRow]} onPress={() => start('mix')}>
            <ShuffleIcon size={22} color={colors.primary} />
            <View style={styles.flex}>
              <Typography preset="h4" color={colors.primary}>Mix</Typography>
              <Typography preset="caption" color={colors.textSecondary}>Random mix of all types below</Typography>
            </View>
            <ChevronRightIcon size={18} color={colors.primary} />
          </Pressable>

          {modes.map(m => (
            <Pressable key={m} style={styles.row} onPress={() => start(m)}>
              <View style={styles.flex}>
                <Typography preset="h4" color={colors.textPrimary}>{MODE_META[m].label}</Typography>
                {!MODE_META[m].scored && (
                  <Typography preset="caption" color={colors.textSecondary}>Practice · not scored</Typography>
                )}
              </View>
              <ChevronRightIcon size={18} color={colors.textDisabled} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
    body: { padding: layout.screenPaddingH, gap: spacing[3] },
    sectionLabel: { marginBottom: spacing[1] },
    flex: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundCard,
    },
    mixRow: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
    mt2: { marginTop: spacing[2] },
    mt3: { marginTop: spacing[3] },
    mt4: { marginTop: spacing[4] },
  });
}
