import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
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
import { layout, spacing, useTheme } from '../../theme';
import type { StudySet } from '../../types';

type Props = ProfileScreenProps<'UserProfile'>;

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: '🌐 Public',
  FRIENDS: '👥 Friends',
  PRIVATE: '🔒 Private',
};

export function UserProfileScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
    navigation.navigate('LibraryTab', {
      screen: 'SetDetail',
      params: { setId: set.id, setTitle: set.title, isOwner: false },
    });

  return (
    <Screen header={<ScreenHeader title={user.name ?? 'Profile'} onBack={() => navigation.goBack()} />}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <View style={styles.avatarContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={48} color={colors.textSecondary} />
            </View>
          )}
        </View>

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
              <Pressable key={set.id} style={styles.setCard} onPress={() => openSet(set)}>
                <View style={styles.setIcon}>
                  <BookIcon size={18} color={colors.primary} />
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

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: {
      padding: layout.screenPaddingH,
      paddingTop: spacing[6],
      gap: spacing[3],
      alignItems: 'stretch',
    },
    avatarContainer: { alignItems: 'center', marginBottom: spacing[2] },
    avatar: { width: layout.avatarLg, height: layout.avatarLg, borderRadius: layout.avatarLg / 2 },
    avatarPlaceholder: {
      width: layout.avatarLg,
      height: layout.avatarLg,
      borderRadius: layout.avatarLg / 2,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
    },
    bio: { marginVertical: spacing[1] },
    actions: { gap: spacing[2], marginTop: spacing[4] },
    blockBtn: { marginTop: spacing[2] },
    setsSection: { marginTop: spacing[4], gap: spacing[2] },
    setsTitle: { marginBottom: spacing[1] },
    setCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: layout.cardRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    setIcon: {
      width: 36,
      height: 36,
      borderRadius: layout.pillRadius,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setInfo: { flex: 1, gap: spacing[0.5] },
  });
}
