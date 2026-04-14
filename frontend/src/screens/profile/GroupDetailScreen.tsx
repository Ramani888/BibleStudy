import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
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
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useGroup, useLeaveGroup, useDeleteGroup, useUpdateMemberRole, useRemoveMember } from '../../hooks/useGroups';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import type { GroupMember } from '../../types/groups.types';

type Props = ProfileScreenProps<'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const { data: group, isLoading, isFetching, error, refetch } = useGroup(groupId);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const myMembership = group?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';
  const isOwner = group?.ownerId === user?.id;

  const handleShare = async () => {
    if (!group) return;
    await Share.share({ message: `Join my BibleStudy group "${group.name}" with code: ${group.inviteCode}` });
  };

  const handleLeave = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          leaveGroup.mutate(groupId, {
            onSuccess: () => navigation.goBack(),
            onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
          });
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Group', 'This will permanently delete the group and all its data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGroup.mutate(groupId, {
            onSuccess: () => navigation.goBack(),
            onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
          });
        },
      },
    ]);
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (error || !group) return <ErrorState message="Could not load group" onRetry={refetch} />;

  const handleToggleRole = (member: GroupMember) => {
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    Alert.alert(
      `${newRole === 'ADMIN' ? 'Promote' : 'Demote'} ${member.user.name}?`,
      `Change role to ${newRole.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateRole.mutate(
            { groupId, userId: member.userId, role: newRole },
            { onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }) },
          ),
        },
      ],
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(`Remove ${member.user.name}?`, 'They can rejoin with the invite code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMember.mutate(
          { groupId, userId: member.userId },
          { onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }) },
        ),
      },
    ]);
  };

  const renderMember = ({ item }: { item: GroupMember }) => {
    const isMemberOwner = item.userId === group?.ownerId;
    const canManage = isAdmin && !isMemberOwner && item.userId !== user?.id;

    return (
      <View style={styles.memberRow}>
        <View style={styles.avatar}>
          <Icon name="person" size={18} color={colors.textSecondary} />
        </View>
        <Typography preset="body" style={styles.flex}>{item.user.name}</Typography>
        {item.role === 'ADMIN' && (
          <View style={styles.adminBadge}>
            <Typography preset="caption" color={colors.primary}>Admin</Typography>
          </View>
        )}
        {canManage && (
          <View style={styles.memberActions}>
            <Pressable onPress={() => handleToggleRole(item)} hitSlop={8}>
              <Icon name="swap-horizontal-outline" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleRemoveMember(item)} hitSlop={8}>
              <Icon name="person-remove-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Typography preset="h2">{group.name}</Typography>
        {group.description ? (
          <Typography preset="body" color={colors.textSecondary}>{group.description}</Typography>
        ) : null}

        <View style={styles.row}>
          <Icon name="people-outline" size={16} color={colors.textSecondary} />
          <Typography preset="caption" color={colors.textSecondary}>
            {group._count?.members ?? group.members?.length ?? 0} members
          </Typography>
          <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
          <Typography preset="caption" color={colors.textSecondary}>
            {group._count?.gatherings ?? 0} gatherings
          </Typography>
        </View>

        {/* Invite code */}
        <Pressable style={styles.inviteRow} onPress={handleShare}>
          <View style={styles.inviteInfo}>
            <Typography preset="label">Invite Code</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{group.inviteCode}</Typography>
          </View>
          <Icon name="share-outline" size={20} color={colors.primary} />
        </Pressable>

        {/* Admin actions */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <Button
              label="Edit Group"
              variant="outline"
              onPress={() => navigation.navigate('EditGroup', { groupId })}
            />
          </View>
        )}

        {/* Members list */}
        <Typography preset="label" style={styles.sectionTitle}>Members</Typography>
        <FlatList
          data={group.members}
          keyExtractor={item => item.userId}
          renderItem={renderMember}
          scrollEnabled={false}
        />

        {/* Leave / Delete */}
        <View style={styles.dangerZone}>
          {!isOwner && (
            <Button label="Leave Group" variant="outline" onPress={handleLeave} style={styles.leaveBtn} />
          )}
          {isOwner && (
            <Button label="Delete Group" variant="outline" onPress={handleDelete} style={styles.leaveBtn} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: layout.screenPaddingH, gap: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1 },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  inviteInfo: { gap: spacing[1] },
  adminActions: { gap: spacing[2] },
  sectionTitle: { marginTop: spacing[2] },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primarySurface,
  },
  memberActions: { flexDirection: 'row', gap: spacing[2] },
  dangerZone: { marginTop: spacing[4] },
  leaveBtn: { borderColor: colors.error },
});
