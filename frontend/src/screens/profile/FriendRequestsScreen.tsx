import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { CARD_FILL_LIGHT, layout, palette, radius, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, CloseCircleIcon } from '../../components/icons';
import {
  useFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
} from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/formatters';
import type { FriendRequest } from '../../types/friends.types';

import { useTranslation } from 'react-i18next';
type Props = ProfileScreenProps<'FriendRequests'>;
type Tab = 'incoming' | 'outgoing';

export function FriendRequestsScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const [tab, setTab] = useState<Tab>('incoming');

  const { data: incomingRequests = [] } = useFriendRequests('incoming');
  const { data: requests = [], isFetching, error, refetch } = useFriendRequests(tab);

  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();
  const cancel = useCancelFriendRequest();

  const incomingCount = incomingRequests.length;

  const handleAccept = useCallback((requestId: string) => {
    accept.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('profile:friends.requestAccepted', 'Friend request accepted') }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  }, [accept, t]);

  const handleReject = useCallback((requestId: string) => {
    reject.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'info', text1: t('profile:friends.requestDeclined', 'Request declined') }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  }, [reject, t]);

  const handleCancel = useCallback((requestId: string) => {
    cancel.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'info', text1: t('profile:friends.requestCancelled', 'Request cancelled') }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  }, [cancel, t]);

  const renderItem = useCallback(({ item }: { item: FriendRequest }) => {
    const person = tab === 'incoming' ? item.sender : item.receiver;
    if (!person) return null;

    const subtitle = person.church ?? formatDate(item.createdAt);

    return (
      <View
        style={[
          styles.card,
          { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
        ]}
      >
        <Pressable
          style={styles.cardInfo}
          onPress={() => navigation.navigate('UserProfile', { userId: person.id })}
        >
          <Avatar uri={person.profileImage ?? null} name={person.name ?? ''} size="sm" />
          <View style={styles.cardInfo}>
            <Typography preset="label" numberOfLines={1}>{person.name}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{subtitle}</Typography>
          </View>
        </Pressable>

        {tab === 'incoming' ? (
          <View style={styles.requestActions}>
            <Pressable onPress={() => handleAccept(item.id)} hitSlop={8} style={styles.actionBtn}>
              <CheckCircleIcon size={28} color={colors.success} />
            </Pressable>
            <Pressable onPress={() => handleReject(item.id)} hitSlop={8} style={styles.actionBtn}>
              <CloseCircleIcon size={28} color={colors.alert} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => handleCancel(item.id)} hitSlop={8} style={styles.actionBtn}>
            <CloseCircleIcon size={26} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    );
  }, [tab, colors, isDark, handleAccept, handleReject, handleCancel, navigation]);

  if (error) return <ErrorState message={t('profile:friends.couldNotLoadRequests', 'Could not load requests')} onRetry={refetch} />;

  return (
    <Screen
      edges={['top']}
      header={<ScreenHeader title={t('profile:menu.friendRequests')} onBack={() => navigation.goBack()} />}
    >
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, tab === 'incoming' && { borderBottomWidth: 2, borderBottomColor: colors.accent }]}
          onPress={() => setTab('incoming')}
        >
          <View style={styles.tabContent}>
            <Typography preset="label" color={tab === 'incoming' ? colors.accent : colors.textSecondary}>
              {t('profile:friends.incoming', 'Incoming')}
            </Typography>
            {incomingCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Typography preset="caption" color={palette.white}>{incomingCount}</Typography>
              </View>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'outgoing' && { borderBottomWidth: 2, borderBottomColor: colors.accent }]}
          onPress={() => setTab('outgoing')}
        >
          <Typography preset="label" color={tab === 'outgoing' ? colors.accent : colors.textSecondary}>
            {t('profile:friends.sent', 'Sent')}
          </Typography>
        </Pressable>
      </View>

      <View style={styles.listWrapper}>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title={t('profile:friends.noRequests', 'No Requests')}
            subtitle={tab === 'incoming' ? t('profile:friends.noPendingRequests', 'No pending friend requests') : t('profile:friends.noSentRequests', 'No sent requests')}
          />
        }
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    borderRadius: radius.r10,
    minWidth: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.xxl },
  separator: { height: spacing.sm },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  listWrapper: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
  },
  cardInfo: { flex: 1, gap: spacing.s2 },
  requestActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { padding: spacing.xs },
});
