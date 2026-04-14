import React from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useUser } from '../../hooks/useUser';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useCancelFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
} from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import { colors, layout, spacing } from '../../theme';

type Props = ProfileScreenProps<'UserProfile'>;

export function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;

  const { data: user, isLoading, isFetching, error, refetch } = useUser(userId);

  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Could not load profile" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const handleSendRequest = () => {
    sendRequest.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request sent' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleCancelRequest = () => {
    if (!user.pendingRequest) {
      return;
    }
    cancelRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Request cancelled' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleAccept = () => {
    if (!user.pendingRequest) {
      return;
    }
    acceptRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request accepted' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleDecline = () => {
    if (!user.pendingRequest) {
      return;
    }
    rejectRequest.mutate(user.pendingRequest.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request declined' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleRemoveFriend = () => {
    removeFriend.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend removed' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleBlock = () => {
    blockUser.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'info', text1: 'User blocked' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Name */}
        <Typography preset="h2" align="center">
          {user.name}
        </Typography>

        {/* Church */}
        {user.church ? (
          <View style={styles.metaRow}>
            <Icon name="home-outline" size={16} color={colors.textSecondary} />
            <Typography preset="body" color={colors.textSecondary}>
              {user.church}
            </Typography>
          </View>
        ) : null}

        {/* Bio */}
        {user.bio ? (
          <Typography
            preset="body"
            color={colors.textSecondary}
            align="center"
            style={styles.bio}
          >
            {user.bio}
          </Typography>
        ) : null}

        {/* Member since */}
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
          <Typography preset="bodySm" color={colors.textSecondary}>
            Member since {memberSince}
          </Typography>
        </View>

        {/* Mutual friends */}
        {user.mutualFriendsCount > 0 ? (
          <View style={styles.metaRow}>
            <Icon name="people-outline" size={16} color={colors.textSecondary} />
            <Typography preset="bodySm" color={colors.textSecondary}>
              {user.mutualFriendsCount} mutual{' '}
              {user.mutualFriendsCount === 1 ? 'friend' : 'friends'}
            </Typography>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {user.isFriend ? (
            <Button
              label="Remove Friend"
              variant="outline"
              onPress={handleRemoveFriend}
              loading={removeFriend.isPending}
              fullWidth
            />
          ) : user.pendingRequest?.direction === 'outgoing' ? (
            <>
              <Button
                label="Request Pending"
                variant="secondary"
                disabled
                fullWidth
              />
              <Button
                label="Cancel Request"
                variant="outline"
                onPress={handleCancelRequest}
                loading={cancelRequest.isPending}
                fullWidth
              />
            </>
          ) : user.pendingRequest?.direction === 'incoming' ? (
            <>
              <Button
                label="Accept"
                variant="primary"
                onPress={handleAccept}
                loading={acceptRequest.isPending}
                fullWidth
              />
              <Button
                label="Decline"
                variant="outline"
                onPress={handleDecline}
                loading={rejectRequest.isPending}
                fullWidth
              />
            </>
          ) : (
            <Button
              label="Send Friend Request"
              variant="primary"
              onPress={handleSendRequest}
              loading={sendRequest.isPending}
              fullWidth
            />
          )}

          <Button
            label="Block User"
            variant="danger"
            onPress={handleBlock}
            loading={blockUser.isPending}
            fullWidth
            style={styles.blockBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingH,
    paddingTop: spacing[6],
    gap: spacing[3],
    alignItems: 'stretch',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  avatar: {
    width: layout.avatarLg,
    height: layout.avatarLg,
    borderRadius: layout.avatarLg / 2,
  },
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
  bio: {
    marginVertical: spacing[1],
  },
  actions: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  blockBtn: {
    marginTop: spacing[2],
  },
});
