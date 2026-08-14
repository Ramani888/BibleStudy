import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { LibraryScreenProps } from '../../navigation/types';
import { useSets, useCreatePlan } from '../../hooks';
import { Button, Screen, ScreenHeader } from '../../components/ui';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, layout } from '../../theme';

type Props = LibraryScreenProps<'CreatePlan'>;

export function CreatePlanScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { data: sets = [], isLoading } = useSets();
  const createPlan = useCreatePlan();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));

  const canSave = title.trim().length > 0 && selected.length > 0 && !createPlan.isPending;

  const handleSave = () => {
    createPlan.mutate(
      { title: title.trim(), description: description.trim() || undefined, setIds: selected },
      {
        onSuccess: plan => {
          Toast.show({ type: 'success', text1: 'Plan created' });
          navigation.replace('PlanDetail', { planId: plan.id });
        },
        onError: e => Toast.show({ type: 'error', text1: 'Could not create plan', text2: getErrorMessage(e) }),
      },
    );
  };

  const header = <ScreenHeader title="New Study Plan" handle />;
  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label="Create Plan" onPress={handleSave} disabled={!canSave} loading={createPlan.isPending} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputs}>
          <Input placeholder="Plan title" value={title} onChangeText={setTitle} maxLength={200} />
          <Input placeholder="Description (optional)" value={description} onChangeText={setDescription} maxLength={1000} multiline style={styles.descInput} />
        </View>

        <View>
          <Typography preset="label" color={colors.textSecondary} style={styles.label}>
            Pick sets in order ({selected.length} selected)
          </Typography>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : sets.length === 0 ? (
          <Typography preset="bodySm" color={colors.textSecondary} style={styles.empty}>
            No sets yet — create some sets first.
          </Typography>
        ) : (
          sets.map(set => {
            const idx = selected.indexOf(set.id);
            const isSel = idx >= 0;
            return (
              <Pressable
                key={set.id}
                style={({ pressed }) => [
                  styles.setRow,
                  { borderColor: isSel ? colors.accent : colors.border, backgroundColor: isSel ? colors.accentSoft : colors.surface },
                  pressed && styles.rowPressed,
                ]}
                onPress={() => toggle(set.id)}
              >
                <View
                  style={[
                    styles.badge,
                    isSel
                      ? { backgroundColor: colors.accent }
                      : { borderWidth: 1.5, borderColor: colors.border },
                  ]}
                >
                  <Typography preset="caption" color={isSel ? colors.textOnAccent : colors.textSecondary}>
                    {isSel ? idx + 1 : ''}
                  </Typography>
                </View>
                <Typography preset="body" numberOfLines={1} style={styles.setTitle}>{set.title}</Typography>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, gap: spacing.md },
  inputs: { gap: spacing.md },
  descInput: { minHeight: 72 }, // ponytail: off-grid Figma value
  label: { marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
  empty: { textAlign: 'center', marginVertical: spacing.lg },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: layout.cardRadius, borderWidth: 1.5,
  },
  rowPressed: { opacity: 0.7 },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, // ponytail: off-grid Figma values (26, 13)
  setTitle: { flex: 1 },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
