import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { QMAddButton, QMEmpty, QMSearchField, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { ChevronLeftIcon, LeafIcon, PlanIcon, RefreshIcon, SearchIcon } from '../../components/icons';
import { usePlans, useManualRefresh } from '../../hooks';
import { useTheme, spacing, radius } from '../../theme';
import { loadFailed } from '../../utils/queryState';
import type { LibraryScreenProps } from '../../navigation/types';
import type { PlanListItem } from '../../types';

const TOUCH = 44;
const RING = 56;
const RING_R = 22;
const RING_W = 6;
const RING_LEN = 2 * Math.PI * RING_R;

export function StudyPlansScreen({ navigation }: LibraryScreenProps<'StudyPlans'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const plansQuery = usePlans();
  const { data: plans = [], isLoading, refetch } = plansQuery;
  const failed = loadFailed(plansQuery);
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? plans.filter(p => p.title.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)) : plans),
    [plans, q],
  );
  const newPlan = useCallback(() => navigation.navigate('CreatePlan'), [navigation]);

  const renderItem = useCallback(({ item, index }: { item: PlanListItem; index: number }) => {
    const pct = item.totalSteps > 0 ? item.completedSteps / item.totalSteps : 0;
    const done = item.totalSteps > 0 && item.completedSteps === item.totalSteps;
    return (
      <Animated.View entering={qmRowEnter(index)}>
        <AnimatedPressable
          scaleTo={0.98}
          onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
          style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <View style={styles.ring}>
            <Svg width={RING} height={RING} style={styles.ringSvg}>
              <Circle cx={RING / 2} cy={RING / 2} r={RING_R} stroke={qm.lilac} strokeWidth={RING_W} fill="none" />
              <Circle
                cx={RING / 2} cy={RING / 2} r={RING_R}
                stroke={done ? qm.leaf : qm.violet} strokeWidth={RING_W} fill="none" strokeLinecap="round"
                strokeDasharray={RING_LEN} strokeDashoffset={RING_LEN * (1 - pct)}
              />
            </Svg>
            {done
              ? <LeafIcon size={22} color={qm.leaf} />
              : <Typography preset="qmTag" color={qm.ink} style={styles.pct}>{Math.round(pct * 100)}%</Typography>}
          </View>
          <View style={styles.flex}>
            <Typography preset="qmRowTitle" color={qm.ink} style={styles.title}>{item.title}</Typography>
            {item.description ? <Typography preset="qmBody" color={qm.muted} numberOfLines={2} style={styles.desc}>{item.description}</Typography> : null}
            <Typography preset="qmLabel" color={done ? qm.leafText : qm.link} style={styles.steps}>
              {done
                ? t('library:qm.planComplete', 'Plan complete')
                : t('library:qm.stepsDone', { done: item.completedSteps, total: item.totalSteps, defaultValue: `${item.completedSteps} of ${item.totalSteps} steps done` })}
            </Typography>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }, [navigation, qm, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <View style={styles.topRow}>
        <Pressable onPress={navigation.goBack} style={({ pressed }) => [styles.back, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('common:actions.back', 'Back')}>
          <ChevronLeftIcon size={20} color={qm.ink} />
        </Pressable>
        <QMAddButton onPress={newPlan} label={t('library:qm.newPlanA11y', 'Create a study plan')} />
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('library:qm.plansTitle', 'Study plans')}</Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>{t('library:qm.plansSub', 'A guided path through your sets, one step at a time.')}</Typography>
      {plans.length > 0 && (
        <View style={styles.search}>
          <QMSearchField value={search} onChangeText={setSearch} placeholder={t('library:qm.searchPlans', 'Search your plans')} />
        </View>
      )}
      <View style={styles.headerEnd} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (failed) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={RefreshIcon}
        title={t('library:qm.plansFailedTitle', 'Your plans did not load')}
        text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
        action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: onRefresh }} />
    );
  } else if (!plans.length) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={PlanIcon}
        title={t('library:plans.emptyTitle', 'No study plans yet')}
        text={t('library:qm.plansEmptyText', 'A plan walks you through your sets in order, one step at a time.')}
        action={{ label: t('library:qm.firstPlan', 'Make your first plan'), onPress: newPlan }} />
    );
  } else if (!filtered.length) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={SearchIcon}
        title={t('library:qm.noPlansMatch', 'No plans match')}
        text={t('library:qm.noMatchText', { query: search.trim() })}
        action={{ label: t('library:qm.clearSearch', 'Clear search'), onPress: () => setSearch('') }} />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isLoading || failed ? [] : filtered}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { width: TOUCH, height: TOUCH, marginLeft: -spacing.s10, alignItems: 'center', justifyContent: 'center' },
  h1: { marginTop: spacing.s10, marginBottom: spacing.xs },
  search: { marginTop: spacing.lg },
  headerEnd: { height: spacing.lg },
  sep: { height: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: radius.r21 + 1, marginTop: 0 },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  pct: { fontSize: 13 },
  title: { fontSize: 18, lineHeight: 23 },
  desc: { marginTop: spacing.s3 },
  steps: { marginTop: spacing.sm },
  loading: { marginTop: spacing.huge },
  emptyGap: { marginTop: spacing.s48 },
});
