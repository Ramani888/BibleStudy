import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { RootScreenProps } from '../../navigation/types';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CalendarIcon, HomeIcon, UserIcon, UsersIcon, BookIcon } from '../../components/icons';
import { useUser } from '../../hooks/useUser';
import { useUserSets } from '../../hooks/useSets';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useCancelFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
} from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import { formatDateOnly } from '../../utils/formatters';
import { CARD_FILL_LIGHT, layout, spacing, useTheme } from '../../theme';
import type { StudySet } from '../../types';

type Props = RootScreenProps<'UserProfile'>;

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: '🌐 Public',
  FRIENDS: '👥 Friends',
  PRIVATE: '🔒 Private',
};

export function UserProfileScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const { userId } = route.params;

  const { data: user, isLoading, isFetching, error, refetch } = useUser(userId);
  const { data: sets = [] } = useUserSets(userId);

  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();

  if (isLoading) return <LoadingOverlay visible />;

  if (error || !user) {
    return (
      <Screen header={<ScreenHeader title="Profile" onBack={() => navigation.goBack()} />}>
        <ErrorState message="Could not load profile" onRetry={refetch} />
      </Screen>
    );
  }

  const handleSendRequest = () => {
    sendRequest.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request sent' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleCancelRequest = () => {
    if (!user.pendingRequest) return;
    cancelRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Request cancelled' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleAccept = () => {
    if (!user.pendingRequest) return;
    acceptRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request accepted' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleDecline = () => {
    if (!user.pendingRequest) return;
    rejectRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request declined' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleRemoveFriend = () => {
    removeFriend.mutate(userId, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Friend removed' });
        navigation.goBack();
      },
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleBlock = () => {
    blockUser.mutate(userId, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'User blocked' });
        navigation.goBack();
      },
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const openSet = (set: StudySet) =>
    navigation.navigate('SetDetail', { setId: set.id, setTitle: set.title, isOwner: false });

  return (
    <Screen header={<ScreenHeader title={user.name ?? 'Profile'} onBack={() => navigation.goBack()} />}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <View style={styles.avatarContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
              <UserIcon size={48} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View>
        <Typography preset="h4" align="center">{user.name}</Typography>

        {user.church ? (
          <View style={styles.metaRow}>
            <HomeIcon size={16} color={colors.textSecondary} />
            <Typography preset="body" color={colors.textSecondary}>{user.church}</Typography>
          </View>
        ) : null}

        {user.bio ? (
          <Typography preset="body" color={colors.textSecondary} align="center" style={styles.bio}>
            {user.bio}
          </Typography>
        ) : null}

        <View style={styles.metaRow}>
          <CalendarIcon size={16} color={colors.textSecondary} />
          <Typography preset="caption" color={colors.textSecondary}>
            Member since {formatDateOnly(user.createdAt)}
          </Typography>
        </View>

        {user.mutualFriendsCount > 0 ? (
          <View style={styles.metaRow}>
            <UsersIcon size={16} color={colors.textSecondary} />
            <Typography preset="caption" color={colors.textSecondary}>
              {user.mutualFriendsCount} mutual {user.mutualFriendsCount === 1 ? 'friend' : 'friends'}
            </Typography>
          </View>
        ) : null}

        </View>

        <View style={styles.actions}>
          {user.isFriend ? (
            <Button label="Remove Friend" variant="outline" onPress={handleRemoveFriend} loading={removeFriend.isPending} fullWidth />
          ) : user.pendingRequest?.direction === 'outgoing' ? (
            <>
              <Button label="Request Pending" variant="secondary" disabled fullWidth />
              <Button label="Cancel Request" variant="outline" onPress={handleCancelRequest} loading={cancelRequest.isPending} fullWidth />
            </>
          ) : user.pendingRequest?.direction === 'incoming' ? (
            <>
              <Button label="Accept" variant="primary" onPress={handleAccept} loading={acceptRequest.isPending} fullWidth />
              <Button label="Decline" variant="outline" onPress={handleDecline} loading={rejectRequest.isPending} fullWidth />
            </>
          ) : (
            <Button label="Send Friend Request" variant="primary" onPress={handleSendRequest} loading={sendRequest.isPending || isFetching} fullWidth />
          )}
          <Button label="Block User" variant="danger" onPress={handleBlock} loading={blockUser.isPending} fullWidth style={styles.blockBtn} />
        </View>

        {sets.length > 0 ? (
          <View style={styles.setsSection}>
            <Typography preset="label" style={styles.setsTitle}>Their Sets</Typography>
            {sets.map(set => (
              <Pressable
                key={set.id}
                style={({ pressed }) => [
                  styles.setCard,
                  { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
                  !isDark && styles.cardShadow,
                  pressed && styles.setCardPressed,
                ]}
                onPress={() => openSet(set)}
              >
                <View style={[styles.setIcon, { backgroundColor: colors.accentSoft }]}>
                  <BookIcon size={18} color={colors.accent} />
                </View>
                <View style={styles.setInfo}>
                  <Typography preset="label" numberOfLines={1}>{set.title}</Typography>
                  <Typography preset="caption" color={colors.textSecondary}>
                    {set._count?.cards ?? 0} cards · {VISIBILITY_LABEL[set.visibility] ?? set.visibility}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPaddingH,
    paddingTop: spacing.xxl,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: layout.avatarLg, height: layout.avatarLg, borderRadius: layout.avatarLg / 2 },
  avatarPlaceholder: {
    width: layout.avatarLg,
    height: layout.avatarLg,
    borderRadius: layout.avatarLg / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bio: { marginVertical: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  blockBtn: { marginTop: spacing.sm },
  setsSection: { marginTop: spacing.lg, gap: spacing.sm },
  setsTitle: { marginBottom: spacing.xs },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
  },
  setIcon: {
    width: 36, // ponytail: off-grid Figma value, no s36 token
    height: 36,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setInfo: { flex: 1, gap: spacing.s2 },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  setCardPressed: { opacity: 0.7 },
});
