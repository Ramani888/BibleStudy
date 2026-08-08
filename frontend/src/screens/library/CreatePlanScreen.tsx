import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { LibraryScreenProps, ProfileScreenProps } from '../../navigation/types';
import { useSets, useCreatePlan } from '../../hooks';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../api';
import { type Theme, useTheme } from '../../theme';

// Hosted in both the Library stack (personal plans) and the Profile stack
// (group plans, via CreateGroupPlan with a groupId param).
type Props = LibraryScreenProps<'CreatePlan'> | ProfileScreenProps<'CreateGroupPlan'>;

export function CreatePlanScreen({ navigation, route }: Props) {
  const groupId = (route.params as { groupId?: string } | undefined)?.groupId;
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: sets = [], isLoading } = useSets();
  const createPlan = useCreatePlan();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]); // ordered setIds

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));

  const canSave = title.trim().length > 0 && selected.length > 0 && !createPlan.isPending;

  const handleSave = () => {
    createPlan.mutate(
      { title: title.trim(), description: description.trim() || undefined, setIds: selected, groupId },
      {
        onSuccess: plan => {
          Toast.show({ type: 'success', text1: 'Plan created' });
          // Group plans live under the group → just go back to GroupDetail (its list refetches).
          // Personal plans → jump straight into the new plan.
          if (groupId) navigation.goBack();
          else (navigation as LibraryScreenProps<'CreatePlan'>['navigation']).replace('PlanDetail', { planId: plan.id });
        },
        onError: e => Toast.show({ type: 'error', text1: 'Could not create plan', text2: getErrorMessage(e) }),
      },
    );
  };

  return (
    <Screen header={<ScreenHeader title="New Study Plan" onClose={navigation.goBack} />}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Input placeholder="Plan title" value={title} onChangeText={setTitle} maxLength={200} />
        <Input placeholder="Description (optional)" value={description} onChangeText={setDescription} maxLength={1000} multiline style={styles.descInput} />

        <Typography preset="label" color={colors.textSecondary} style={styles.label}>
          Pick sets in order ({selected.length} selected)
        </Typography>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : sets.length === 0 ? (
          <Typography preset="bodySm" color={colors.textSecondary} style={styles.empty}>
            No sets yet — create some sets first.
          </Typography>
        ) : (
          sets.map(set => {
            const idx = selected.indexOf(set.id);
            const isSel = idx >= 0;
            return (
              <Pressable key={set.id} style={[styles.setRow, isSel && styles.setRowSel]} onPress={() => toggle(set.id)}>
                <View style={[styles.badge, isSel ? styles.badgeSel : styles.badgeIdle]}>
                  <Typography preset="caption" color={isSel ? colors.background : colors.textSecondary}>
                    {isSel ? idx + 1 : ''}
                  </Typography>
                </View>
                <Typography preset="body" numberOfLines={1} style={styles.setTitle}>{set.title}</Typography>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Create Plan" onPress={handleSave} disabled={!canSave} loading={createPlan.isPending} fullWidth />
      </View>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  scroll: { padding: layout.screenPaddingH, gap: spacing[3], paddingBottom: spacing[6] },
  descInput: { minHeight: 72 },
  label: { marginTop: spacing[2] },
  loader: { marginVertical: spacing[4] },
  empty: { textAlign: 'center', marginVertical: spacing[4] },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: layout.cardRadius, borderWidth: 1.5, borderColor: colors.border,
  },
  setRowSel: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeSel: { backgroundColor: colors.primary },
  badgeIdle: { borderWidth: 1.5, borderColor: colors.border },
  setTitle: { flex: 1 },
  footer: { padding: layout.screenPaddingH, borderTopWidth: 1, borderTopColor: colors.border },
});
