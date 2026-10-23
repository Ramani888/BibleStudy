import React, { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { formatDateWithTime } from '../../utils/formatters';
import { radius, spacing, useTheme, type QMColors } from '../../theme';
import { QMBackButton, QMEmpty, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { InfoIcon, LeafIcon, MegaphoneIcon, PersonCheckIcon, PersonPlusIcon, TrashIcon, type IconComponent } from '../../components/icons';
import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useNotificationPrefs, TYPE_TO_PREF,
} from '../../hooks';
import { loadFailed } from '../../utils/queryState';
import type { Notification } from '../../types/notification.types';

type Props = ProfileScreenProps<'Notifications'>;
type Section = { key: 'today' | 'yesterday' | 'earlier'; data: Notification[] };

const ICON = 40;
const DOT = 9;
const DELETE_W = 84;
const DAY_MS = 86_400_000;

function kind(type: Notification['type'], qm: QMColors): [IconComponent, string, string] {
  switch (type) {
    case 'friend_request': return [PersonPlusIcon, qm.lilac, qm.link];
    case 'friend_accepted': return [PersonCheckIcon, qm.lilac, qm.link];
    case 'achievement': return [LeafIcon, qm.leafBg, qm.leaf];
    default: return [MegaphoneIcon, qm.goldBg, qm.goldText];
  }
}

function groupByDate(list: Notification[]): Section[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - DAY_MS);
  const out: Section[] = [{ key: 'today', data: [] }, { key: 'yesterday', data: [] }, { key: 'earlier', data: [] }];
  for (const n of list) {
    const d = new Date(n.createdAt);
    out[d >= today ? 0 : d >= yesterday ? 1 : 2].data.push(n);
  }
  return out.filter(s => s.data.length > 0);
}

export function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const notifQuery = useNotifications();
  const { data, isLoading, isFetching, refetch } = notifQuery;
  const isError = loadFailed(notifQuery); // offline with nothing cached → error, not "All quiet"
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const prefs = useNotificationPrefs();

  const notifications = useMemo(() => (data?.notifications ?? []).filter(n => {
    const prefKey = TYPE_TO_PREF[n.type];
    return prefKey ? prefs[prefKey] !== false : true;
  }), [data, prefs]);
  const sections = useMemo(() => groupByDate(notifications), [notifications]);
  const hasUnread = notifications.some(n => !n.read);

  const openSwipeable = useRef<Swipeable | null>(null);

  const goBack = navigation.goBack; // from Home → back to Home (navigation/returnHome.ts)

  const remove = useCallback((id: string) => {
    deleteNotification.mutate(id, {
      onSuccess: () => Toast.show({ type: 'info', text1: t('profile:qmNotifList.deleted') }),
    });
  }, [deleteNotification, t]);

  const renderItem = useCallback(({ item, index, section }: { item: Notification; index: number; section: Section }) => {
    const [Icon, tint, ink] = kind(item.type, qm);
    const first = index === 0;
    const last = index === section.data.length - 1;
    let self: Swipeable | null = null;
    return (
      <Animated.View
        entering={qmRowEnter(index)}
        style={[styles.cell, { backgroundColor: qm.error }, first && styles.cellFirst, last && styles.cellLast]}
      >
        <Swipeable
          ref={r => { self = r; }}
          onSwipeableOpen={() => {
            if (openSwipeable.current !== self) openSwipeable.current?.close();
            openSwipeable.current = self;
          }}
          renderRightActions={() => (
            <Pressable
              style={({ pressed }) => [styles.delete, pressed && styles.dim]}
              onPress={() => remove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={t('profile:qmNotifList.delete')}
            >
              <TrashIcon size={20} color={qm.onDanger} />
              <Typography preset="qmChip" color={qm.onDanger}>{t('profile:qmNotifList.delete')}</Typography>
            </Pressable>
          )}
        >
          <AnimatedPressable
            scaleTo={0.99}
            onPress={() => {
              if (!item.read) markRead.mutate(item.id);
              if (item.type === 'friend_request' || item.type === 'friend_accepted') navigation.navigate('Friends');
              else if (item.type === 'achievement') navigation.navigate('Achievements');
            }}
            style={[styles.row, { backgroundColor: item.read ? qm.surface : qm.unread }, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.read ? '' : `${t('profile:qmNotifList.unread')}. `}${item.title}. ${item.body}`}
          >
            <View style={[styles.icon, { backgroundColor: tint }]}>
              <Icon size={19} color={ink} strokeWidth={2} />
            </View>
            <View style={styles.flex}>
              <Typography preset={item.read ? 'qmRow' : 'qmBodyLg'} color={qm.ink}>{item.title}</Typography>
              <Typography preset="qmBody" color={qm.body} numberOfLines={2} style={styles.body}>{item.body}</Typography>
              <Typography preset="qmFine" color={qm.muted} style={styles.when}>{formatDateWithTime(item.createdAt)}</Typography>
            </View>
            {!item.read && <View style={[styles.dot, { backgroundColor: qm.violet }]} />}
          </AnimatedPressable>
        </Swipeable>
      </Animated.View>
    );
  }, [qm, markRead, navigation, remove, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <View style={styles.topRow}>
        <QMBackButton onPress={goBack} label={t('profile:qmNotifList.back')} />
        {hasUnread && (
          <AnimatedPressable scaleTo={0.97} onPress={() => markAllRead.mutate()} style={[styles.markAll, { backgroundColor: qm.lilac }]} accessibilityRole="button">
            <Typography preset="qmLink" color={qm.link}>{t('profile:qmNotifList.markAll')}</Typography>
          </AnimatedPressable>
        )}
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmNotifList.title')}</Typography>
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmNotifList.loadFailed')} action={{ label: t('profile:qmNotifList.tryAgain'), onPress: () => refetch() }} />;
  else empty = <QMEmpty icon={LeafIcon} title={t('profile:qmNotifList.emptyTitle')} text={t('profile:qmNotifList.emptyText')} />;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <SectionList
        sections={isError ? [] : sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t(`profile:qmNotifList.${section.key}`)}</Typography>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={sections.length > 0 ? (
          <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.hint}>{t('profile:qmNotifList.swipeHint')}</Typography>
        ) : null}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.7 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markAll: { height: spacing.huge, paddingHorizontal: spacing.s14, borderRadius: radius.pill, justifyContent: 'center' },
  h1: { marginTop: spacing.s6 },
  section: { marginTop: spacing.s22, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  cell: { overflow: 'hidden' },
  cellFirst: { borderTopLeftRadius: radius.r20, borderTopRightRadius: radius.r20 },
  cellLast: { borderBottomLeftRadius: radius.r20, borderBottomRightRadius: radius.r20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg },
  icon: { width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: spacing.s2 },
  when: { marginTop: spacing.xs },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, marginTop: spacing.s6 },
  delete: { width: DELETE_W, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  loading: { marginTop: spacing.xxxl },
  hint: { marginTop: spacing.s18, marginHorizontal: spacing.s6 },
});
