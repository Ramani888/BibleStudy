import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorState } from '../../components/feedback';
import { Button, Spacer, Typography } from '../../components/ui';
import { useCards } from '../../hooks';
import { supportedModes, MODE_META, MIN_MC_CARDS } from '../../hooks/useQuizSession';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { QuizSelectableMode } from '../../types';

const ICON_SIZE = 20;
type Params = { setId: string; setTitle: string; isOwner?: boolean };

export function QuizModePickerScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ P: Params }, 'P'>>();
  const { setId, setTitle } = params;
  const { data: cards = [], isLoading, isError, error, refetch } = useCards(setId);

  const modes = supportedModes(cards);
  const start = (mode: QuizSelectableMode) =>
    navigation.navigate('Quiz', { setId, setTitle, mode });

  const Frame = (children: React.ReactNode) => (
    <SafeAreaView style={styles.safe} edges={['top']}>{children}</SafeAreaView>
  );

  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (isLoading) return Frame(<View style={styles.center}><Typography preset="body" color={colors.textSecondary}>Loading…</Typography></View>);

  if (modes.length === 0) {
    return Frame(
      <View style={styles.center}>
        <Icon name="help-circle-outline" size={48} color={colors.textDisabled} />
        <Spacer size={spacing[3]} />
        <Typography preset="h4" align="center">No quiz available yet</Typography>
        <Spacer size={spacing[2]} />
        <Typography preset="body" color={colors.textSecondary} align="center">
          Add cards to this set (multiple-choice needs {MIN_MC_CARDS}+ cards of a type).
        </Typography>
        <Spacer size={spacing[4]} />
        <Button label="Go Back" variant="outline" onPress={() => navigation.goBack()} />
      </View>,
    );
  }

  return Frame(
    <View style={styles.body}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Icon name="chevron-back" size={ICON_SIZE} color={colors.primary} />
        </Pressable>
        <View style={styles.flex}>
          <Typography preset="h3" numberOfLines={1}>{setTitle}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>Choose a quiz type</Typography>
        </View>
      </View>

      <Pressable style={[styles.row, styles.mixRow]} onPress={() => start('mix')}>
        <Icon name="shuffle" size={22} color={colors.primary} />
        <View style={styles.flex}>
          <Typography preset="h4" color={colors.primary}>Mix</Typography>
          <Typography preset="caption" color={colors.textSecondary}>Random mix of all types below</Typography>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {modes.map(m => (
        <Pressable key={m} style={styles.row} onPress={() => start(m)}>
          <View style={styles.flex}>
            <Typography preset="h4" color={colors.textPrimary}>{MODE_META[m].label}</Typography>
            {!MODE_META[m].scored && <Typography preset="caption" color={colors.textSecondary}>Practice · not scored</Typography>}
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textDisabled} />
        </Pressable>
      ))}
    </View>,
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
  body: { flex: 1, padding: layout.screenPaddingH, gap: spacing[3] },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  back: { padding: spacing[1] },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  mixRow: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
});
