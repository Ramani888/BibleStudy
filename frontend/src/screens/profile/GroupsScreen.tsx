import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, shadows, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { ListCard } from '../../components/ui/ListCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ChevronRightIcon, CompassIcon, PlusIcon, UsersIcon } from '../../components/icons';
import { useGroups } from '../../hooks/useGroups';
import type { Group } from '../../types/groups.types';

const FAB_SIZE = 56;

type Props = ProfileScreenProps<'Groups'>;

export function GroupsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { data: groups = [], isFetching, error, refetch } = useGroups();

  const renderItem = useCallback(({ item }: { item: Group }) => (
    <ListCard
      leading={
        <View style={styles.groupIcon}>
          <UsersIcon size={22} color={colors.primary} />
        </View>
      }
      title={item.name}
      subtitle={`${item._count?.members ?? 0} members · ${item.visibility.toLowerCase()}`}
      trailing={<ChevronRightIcon size={20} color={colors.textSecondary} />}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
    />
  ), [navigation, colors, styles]);

  if (error) return <ErrorState message="Could not load groups" onRetry={refetch} />;

  return (
    <Screen
      header={
        <ScreenHeader
          title="My Groups"
          onBack={() => navigation.goBack()}
          right={
            <Pressable onPress={() => navigation.navigate('PublicGroups')} hitSlop={8}>
              <CompassIcon size={22} color={colors.primary} />
            </Pressable>
          }
        />
      }
    >
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Groups Yet"
            subtitle="Create a study group or browse public groups to join"
            ctaLabel="Create Group"
            onCta={() => navigation.navigate('CreateGroup')}
          />
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <PlusIcon size={28} color={colors.textOnPrimary} />
      </Pressable>
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: spacing[3] },
    list: { padding: layout.screenPaddingH },
    separator: { height: spacing[3] },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    groupIcon: {
      width: 44, height: 44, borderRadius: layout.pillRadius,
      backgroundColor: colors.primarySurface,
      alignItems: 'center', justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: spacing[6],
      right: spacing[4],
      width: FAB_SIZE, height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      ...shadows.md,
    },
  });
}
