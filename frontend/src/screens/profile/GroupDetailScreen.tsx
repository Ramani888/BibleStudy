import React from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CalendarIcon, ShareIcon, SwapIcon, UserMinusIcon, UsersIcon } from '../../components/icons';
import { useGroup, useLeaveGroup, useDeleteGroup, useUpdateMemberRole, useRemoveMember } from '../../hooks/useGroups';
import { useConfirmDialog } from '../../hooks';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import type { GroupMember } from '../../types/groups.types';

type Props = ProfileScreenProps<'GroupDetail'>;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { groupId } = route.params;
  const user = useAuthStore(s => s.user);
  const { data: group, isLoading, isFetching, error, refetch } = useGroup(groupId);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { show, dialogProps } = useConfirmDialog();

  if (isLoading) return <LoadingOverlay visible />;
  if (error || !group) return <ErrorState message="Could not load group" onRetry={refetch} />;

  const myMembership = group?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';
  const isOwner = group?.ownerId === user?.id;

  const handleShare = async () => {
    if (!group) return;
    await Share.share({ message: `Join my BibleStudy group "${group.name}" with code: ${group.inviteCode}` });
  };

  const handleLeave = () => {
    show({
      title: 'Leave Group',
      message: 'Are you sure you want to leave this group?',
      confirmLabel: 'Leave',
      variant: 'danger',
      onConfirm: async () => {
        try { await leaveGroup.mutateAsync(groupId); navigation.goBack(); }
        catch (e) { Toast.show({ type: 'error', text1: getErrorMessage(e) }); }
      },
    });
  };

  const handleDelete = () => {
    show({
      title: 'Delete Group',
      message: 'This will permanently delete the group and all its data.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try { await deleteGroup.mutateAsync(groupId); navigation.goBack(); }
        catch (e) { Toast.show({ type: 'error', text1: getErrorMessage(e) }); }
      },
    });
  };

  const handleToggleRole = (member: GroupMember) => {
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    show({
      title: `${newRole === 'ADMIN' ? 'Promote' : 'Demote'} ${member.user.name}?`,
      message: `Change role to ${newRole.toLowerCase()}.`,
      confirmLabel: 'Confirm',
      variant: 'default',
      onConfirm: async () => {
        try { await updateRole.mutateAsync({ groupId, userId: member.userId, role: newRole }); }
        catch (e) { Toast.show({ type: 'error', text1: getErrorMessage(e) }); }
      },
    });
  };

  const handleRemoveMember = (member: GroupMember) => {
    show({
      title: `Remove ${member.user.name}?`,
      message: 'They can rejoin with the invite code.',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        try { await removeMember.mutateAsync({ groupId, userId: member.userId }); }
        catch (e) { Toast.show({ type: 'error', text1: getErrorMessage(e) }); }
      },
    });
  };

  const renderMember = ({ item }: { item: GroupMember }) => {
    const isMemberOwner = item.userId === group?.ownerId;
    const canManage = isAdmin && !isMemberOwner && item.userId !== user?.id;
    return (
      <View style={styles.memberRow}>
        <Avatar uri={item.user.profileImage ?? null} name={item.user.name ?? ''} size="sm" />
        <Typography preset="label" style={styles.flex}>{item.user.name}</Typography>
        {item.role === 'ADMIN' && (
          <View style={styles.adminBadge}>
            <Typography preset="caption" color={colors.primary}>Admin</Typography>
          </View>
        )}
        {canManage && (
          <View style={styles.memberActions}>
            <Pressable onPress={() => handleToggleRole(item)} hitSlop={8}>
              <SwapIcon size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleRemoveMember(item)} hitSlop={8}>
              <UserMinusIcon size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title={group.name}
          onBack={() => navigation.goBack()}
          right={
            <Pressable onPress={handleShare} hitSlop={8}>
              <ShareIcon size={22} color={colors.primary} />
            </Pressable>
          }
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {group.description ? (
          <Typography preset="body" color={colors.textSecondary}>{group.description}</Typography>
        ) : null}

        <View style={styles.metaRow}>
          <UsersIcon size={16} color={colors.textSecondary} />
          <Typography preset="caption" color={colors.textSecondary}>
            {group._count?.members ?? group.members?.length ?? 0} members
          </Typography>
          <CalendarIcon size={16} color={colors.textSecondary} />
          <Typography preset="caption" color={colors.textSecondary}>
            {group._count?.gatherings ?? 0} gatherings
          </Typography>
        </View>

        <Pressable style={styles.inviteRow} onPress={handleShare}>
          <View style={styles.inviteInfo}>
            <Typography preset="label">Invite Code</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{group.inviteCode}</Typography>
          </View>
          <ShareIcon size={20} color={colors.primary} />
        </Pressable>

        {isAdmin && (
          <Button label="Edit Group" variant="outline" onPress={() => navigation.navigate('EditGroup', { groupId })} />
        )}

        <Typography preset="label" style={styles.sectionTitle}>Members</Typography>
        {group.members?.map(member => (
          <React.Fragment key={member.userId}>
            {renderMember({ item: member })}
          </React.Fragment>
        ))}

        <View style={styles.dangerZone}>
          {!isOwner && (
            <Button label="Leave Group" variant="outline" onPress={handleLeave} style={styles.leaveBtn} />
          )}
          {isOwner && (
            <Button label="Delete Group" variant="outline" onPress={handleDelete} style={styles.leaveBtn} />
          )}
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: { padding: layout.screenPaddingH, gap: spacing[3] },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
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
    sectionTitle: { marginTop: spacing[2] },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing[3],
    },
    adminBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 4,
      backgroundColor: colors.primarySurface,
    },
    memberActions: { flexDirection: 'row', gap: spacing[2] },
    dangerZone: { marginTop: spacing[4] },
    leaveBtn: { borderColor: colors.error },
  });
}
