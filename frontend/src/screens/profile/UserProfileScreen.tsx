import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../api/client';
import { useSendFriendRequest, useRemoveFriend, useBlockUser } from '../../hooks/useFriends';
import { useFriends } from '../../hooks/useFriends';

type Props = ProfileScreenProps<'UserProfile'>;

export function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const { data: friends = [] } = useFriends();
  const sendRequest = useSendFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();

  const friendship = friends.find(f => f.friendId === userId);
  const isFriend = !!friendship;

  const handleAddFriend = () => {
    sendRequest.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request sent' }),
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

  const user = friendship?.friend;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color={colors.textSecondary} />
          </View>
        </View>

        {user ? (
          <>
            <Typography preset="h2" style={styles.centered}>{user.name}</Typography>
            {user.church ? (
              <View style={styles.row}>
                <Icon name="home-outline" size={16} color={colors.textSecondary} />
                <Typography preset="body" color={colors.textSecondary}>{user.church}</Typography>
              </View>
            ) : null}
            {user.bio ? (
              <Typography preset="body" color={colors.textSecondary} style={styles.bio}>
                {user.bio}
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography preset="body" color={colors.textSecondary} style={styles.centered}>
            User Profile
          </Typography>
        )}

        <View style={styles.actions}>
          {isFriend ? (
            <Button label="Remove Friend" variant="outline" onPress={handleRemoveFriend} />
          ) : (
            <Button label="Add Friend" onPress={handleAddFriend} loading={sendRequest.isPending} />
          )}
          <Button label="Block User" variant="outline" onPress={handleBlock} style={styles.blockBtn} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: layout.screenPaddingH, gap: spacing[3], alignItems: 'stretch' },
  avatarContainer: { alignItems: 'center', marginVertical: spacing[4] },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], justifyContent: 'center' },
  bio: { textAlign: 'center' },
  actions: { gap: spacing[2], marginTop: spacing[4] },
  blockBtn: { borderColor: colors.error },
});
