import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { useSearchUsers, useSendFriendRequest } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { UserProfile } from '../../types/friends.types';

type Props = ProfileScreenProps<'SearchUsers'>;

export function SearchUsersScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const { data: users = [], isFetching } = useSearchUsers(query);
  const sendRequest = useSendFriendRequest();

  const handleAdd = (user: UserProfile) => {
    sendRequest.mutate(user.id, {
      onSuccess: () => Toast.show({ type: 'success', text1: `Friend request sent to ${user.name}` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userRow}>
      <Pressable
        style={styles.userInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={colors.textSecondary} />
        </View>
        <View>
          <Typography preset="body">{item.name}</Typography>
          {item.church ? (
            <Typography preset="caption" color={colors.textSecondary}>{item.church}</Typography>
          ) : null}
        </View>
      </Pressable>
      <Pressable style={styles.addBtn} onPress={() => handleAdd(item)} hitSlop={8}>
        <Icon name="person-add-outline" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchBar}>
        <Input
          placeholder="Search by name..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.length > 1 && !isFetching ? (
            <View style={styles.empty}>
              <Typography preset="body" color={colors.textSecondary}>No users found</Typography>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { padding: layout.screenPaddingH },
  list: { paddingHorizontal: layout.screenPaddingH },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: { padding: spacing[1] },
  empty: { padding: layout.screenPaddingH, alignItems: 'center' },
});
