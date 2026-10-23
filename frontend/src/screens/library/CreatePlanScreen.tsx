import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMButton, QMEmpty, QMInput, QMModalScreen } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CardsIcon } from '../../components/icons';
import { useSets, useCreatePlan } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, radius, qmAccent } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const BADGE = 32;
const BAR_W = 10;
const BAR_H = 36;
const ROW_MIN_H = 60;

export function CreatePlanScreen({ navigation }: LibraryScreenProps<'CreatePlan'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const dark = themeName === 'dark';
  const { data: sets = [], isLoading } = useSets();
  const createPlan = useCreatePlan();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));

  const ready = title.trim().length > 0 && selected.length > 0;

  const handleSave = () => {
    createPlan.mutate(
      { title: title.trim(), description: description.trim() || undefined, setIds: selected },
      {
        onSuccess: plan => {
          Toast.show({ type: 'success', text1: t('library:plans.planCreated', 'Plan created') });
          navigation.replace('PlanDetail', { planId: plan.id });
        },
        onError: e => Toast.show({ type: 'error', text1: t('library:plans.couldNotCreatePlan', 'Could not create plan'), text2: getErrorMessage(e) }),
      },
    );
  };

  return (
    <QMModalScreen
      title={t('library:qm.newPlan', 'New study plan')}
      onCancel={navigation.goBack}
      footer={(
        <QMButton
          label={ready ? t('library:qm.createPlanSteps', { count: selected.length }) : t('library:qm.createPlan', 'Create plan')}
          onPress={handleSave}
          off={!ready}
          loading={createPlan.isPending}
          style={styles.flex}
        />
      )}
    >
      <View style={styles.fields}>
        <QMInput
          label={t('library:qm.planName', 'Plan name')}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          placeholder={t('library:qm.planNamePlaceholder', 'e.g. Romans in 30 days')}
          autoCapitalize="sentences"
        />
        <QMInput
          label={t('library:sets.description', 'Description')}
          optional={t('library:qm.optional', '(optional)')}
          value={description}
          onChangeText={setDescription}
          maxLength={1000}
          multiline
          placeholder={t('library:qm.planDescPlaceholder', 'What is this plan for?')}
          autoCapitalize="sentences"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={qm.violet} style={styles.loading} />
      ) : sets.length === 0 ? (
        <QMEmpty
          style={styles.empty}
          icon={CardsIcon}
          title={t('library:qm.needSetTitle', 'You need a set first')}
          text={t('library:qm.needSetText', 'A plan is built from your sets. Make a set, then come back to plan your path.')}
          action={{ label: t('library:qm.createSet', 'Create a set'), onPress: () => navigation.replace('CreateSet', {}) }}
        />
      ) : (
        <>
          <View style={styles.pickHead}>
            <Typography preset="qmSection" color={qm.ink} style={styles.pickTitle}>{t('library:qm.pickSets', 'Pick your sets in order')}</Typography>
            <Typography preset="qmBody" color={qm.muted}>{t('library:qm.selected', { count: selected.length, defaultValue: `${selected.length} selected` })}</Typography>
          </View>
          <Typography preset="qmBody" color={qm.muted} style={styles.pickHint}>{t('library:qm.pickHint', 'Tap sets in the order you want to study them. Tap again to remove.')}</Typography>
          <View style={styles.list}>
            {sets.map(set => {
              const idx = selected.indexOf(set.id);
              const on = idx >= 0;
              const ink = qmAccent(qm, dark, set.color)[1];
              const count = set._count?.cards ?? 0;
              return (
                <AnimatedPressable
                  key={set.id}
                  scaleTo={0.98}
                  onPress={() => toggle(set.id)}
                  style={[
                    styles.row,
                    on
                      ? { backgroundColor: qm.lilac, boxShadow: `inset 0px 0px 0px 2px ${qm.violet}` }
                      : { backgroundColor: qm.surface, boxShadow: qm.cardShadow },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={on ? `${set.title}, ${t('library:qm.stepN', { n: idx + 1, defaultValue: `step ${idx + 1}` })}` : set.title}
                >
                  <View style={[styles.badge, on ? { backgroundColor: qm.violet } : [styles.badgeOff, { borderColor: qm.line }]]}>
                    {on && (
                      <Animated.View key={idx} entering={FadeIn.duration(250)}>
                        <Typography preset="qmLabel" color={qm.onViolet}>{idx + 1}</Typography>
                      </Animated.View>
                    )}
                  </View>
                  <View style={[styles.bar, { backgroundColor: ink }]} />
                  <View style={styles.flex}>
                    <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{set.title}</Typography>
                    <Typography preset="qmMeta" color={qm.muted} style={styles.meta}>{t('library:cards.cardCount', { count })}</Typography>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </>
      )}
    </QMModalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fields: { gap: spacing.lg },
  loading: { marginTop: spacing.xxl },
  empty: { marginTop: spacing.huge },
  pickHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.xxl },
  pickTitle: { fontSize: 16 },
  pickHint: { marginTop: spacing.xs, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: ROW_MIN_H,
    paddingVertical: spacing.s10, paddingHorizontal: spacing.s14, borderRadius: radius.r18,
  },
  badge: { width: BADGE, height: BADGE, borderRadius: BADGE / 2, alignItems: 'center', justifyContent: 'center' },
  badgeOff: { borderWidth: 2 },
  bar: { width: BAR_W, height: BAR_H, borderRadius: radius.r5 },
  meta: { marginTop: spacing.s2 },
});
