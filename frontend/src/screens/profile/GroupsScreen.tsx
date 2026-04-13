import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useGroups } from '../../hooks/useGroups';
import type { Group } from '../../types/groups.types';

type Props = ProfileScreenProps<'Groups'>;

export function GroupsScreen({ navigation }: Props) {
  const { data: groups = [], isLoading, refetch } = useGroups();

  const renderItem = ({ item }: { item: Group }) => (
    <Pressable
      style={styles.groupRow}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
    >
      <View style={styles.groupIcon}>
        <Icon name="people" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Typography preset="body">{item.name}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {item._count?.members ?? 0} members • {item.visibility.toLowerCase()}
        </Typography>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.joinBtn} onPress={() => navigation.navigate('JoinGroup')}>
          <Icon name="link-outline" size={18} color={colors.primary} />
          <Typography preset="label" color={colors.primary}>Join via Code</Typography>
        </Pressable>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Groups Yet"
            subtitle="Create a study group or join one with an invite code"
            ctaLabel="Create Group"
            onCta={() => navigation.navigate('CreateGroup')}
          />
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <Icon name="add" size={28} color={colors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: layout.screenPaddingH },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
