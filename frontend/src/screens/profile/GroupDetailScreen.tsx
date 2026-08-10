import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, Theme, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Card, PressableCard } from '../../components/ui/Card';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import {
  CalendarIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SwapIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from '../../components/icons';
import { useGroup, useLeaveGroup, useDeleteGroup, useUpdateMemberRole, useRemoveMember } from '../../hooks/useGroups';
import { useGroupPlans } from '../../hooks/usePlans';
import { useConfirmDialog } from '../../hooks';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../api/client';
import type { GroupMember } from '../../types/groups.types';

type Props = ProfileScreenProps<'GroupDetail'>;

const HERO_AVATAR_SIZE = 96;

export function GroupDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = makeStyles(theme);
  const { groupId } = route.params;
  const user = useAuthStore(s => s.user);

  const { data: group, isLoading, isFetching, error, refetch } = useGroup(groupId);
  const { data: plans = [] } = useGroupPlans(groupId);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { show, dialogProps } = useConfirmDialog();

  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);

  if (isLoading) return <LoadingOverlay visible />;
  if (error || !group) return <ErrorState message="Could not load group" onRetry={refetch} />;

  const myMembership = group?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';
  const isOwner = group?.ownerId === user?.id;
  const memberCount = group._count?.members ?? group.members?.length ?? 0;

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
    setActiveMemberMenu(null);
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
    setActiveMemberMenu(null);
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

  return (
    <Screen
      header={
        <ScreenHeader
          title=""
          onBack={() => navigation.goBack()}
        />
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        onScrollBeginDrag={() => setActiveMemberMenu(null)}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Avatar
            uri={null}
            name={group.name}
            size="lg"
            style={styles.heroAvatar}
          />
          <Typography preset="h2" style={styles.heroName}>{group.name}</Typography>
          <View style={styles.heroMeta}>
            <UsersIcon size={14} color={colors.textSecondary} />
            <Typography preset="caption" color={colors.textSecondary}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Typography>
            <Typography preset="caption" color={colors.textDisabled}>·</Typography>
            <CalendarIcon size={14} color={colors.textSecondary} />
            <Typography preset="caption" color={colors.textSecondary}>
              {group._count?.gatherings ?? 0} gatherings
            </Typography>
          </View>
        </View>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <View style={styles.actions}>
          {isAdmin && (
            <Pressable
              style={styles.actionPill}
              onPress={() => navigation.navigate('AddGroupMember', { groupId })}
            >
              <UserPlusIcon size={18} color={colors.primary} />
              <Typography preset="caption" color={colors.primary} style={styles.actionLabel}>Add Member</Typography>
            </Pressable>
          )}
          {isAdmin && (
            <Pressable
              style={styles.actionPill}
              onPress={() => navigation.navigate('EditGroup', { groupId })}
            >
              <PencilIcon size={18} color={colors.primary} />
              <Typography preset="caption" color={colors.primary} style={styles.actionLabel}>Edit</Typography>
            </Pressable>
          )}
        </View>

        {/* ── Description ───────────────────────────────────────── */}
        {group.description ? (
          <Card style={styles.section}>
            <Typography preset="label" color={colors.textSecondary} style={styles.sectionLabel}>ABOUT</Typography>
            <Typography preset="body">{group.description}</Typography>
          </Card>
        ) : null}

        {/* ── Study Plans ───────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Typography preset="label">Study Plans</Typography>
            {isAdmin && (
              <Pressable
                onPress={() => navigation.navigate('CreateGroupPlan', { groupId })}
                hitSlop={8}
                style={styles.addBtn}
              >
                <PlusIcon size={16} color={colors.primary} />
                <Typography preset="caption" color={colors.primary}>New</Typography>
              </Pressable>
            )}
          </View>

          {plans.length === 0 ? (
            <Typography preset="caption" color={colors.textSecondary} style={styles.emptyText}>
              No study plans yet{isAdmin ? ' — tap New to create one.' : '.'}
            </Typography>
          ) : (
            plans.map(plan => (
              <PressableCard
                key={plan.id}
                style={styles.planCard}
                onPress={() => navigation.navigate('GroupPlanDetail', { planId: plan.id, groupTitle: group.name })}
              >
                <View style={styles.planTop}>
                  <Typography preset="label" numberOfLines={1} style={styles.flex}>{plan.title}</Typography>
                  <Typography preset="caption" color={colors.textSecondary}>
                    {plan.completedSteps}/{plan.totalSteps}
                  </Typography>
                </View>
                <ProgressBar
                  progress={plan.totalSteps > 0 ? plan.completedSteps / plan.totalSteps : 0}
                  color={colors.primary}
                  style={styles.planBar}
                />
              </PressableCard>
            ))
          )}
        </View>

        {/* ── Members ───────────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <Typography preset="label" style={styles.sectionHeader}>
            Members ({memberCount})
          </Typography>

          <Card style={styles.memberCard}>
            {group.members?.map((member, idx) => {
              const isMemberOwner = member.userId === group?.ownerId;
              const canManage = isAdmin && !isMemberOwner && member.userId !== user?.id;
              const isMenuOpen = activeMemberMenu === member.userId;
              const isLast = idx === (group.members?.length ?? 0) - 1;

              return (
                <View key={member.userId}>
                  <View style={[styles.memberRow, !isLast && !isMenuOpen && styles.memberBorder]}>
                    <Avatar uri={member.user.profileImage ?? null} name={member.user.name ?? ''} size="sm" />
                    <View style={styles.flex}>
                      <Typography preset="label">{member.user.name}</Typography>
                      {isMemberOwner && (
                        <Typography preset="caption" color={colors.textSecondary}>Owner</Typography>
                      )}
                    </View>
                    {member.role === 'ADMIN' && !isMemberOwner && (
                      <View style={styles.adminBadge}>
                        <Typography preset="caption" color={colors.primary}>Admin</Typography>
                      </View>
                    )}
                    {canManage && (
                      <Pressable
                        onPress={() => setActiveMemberMenu(isMenuOpen ? null : member.userId)}
                        hitSlop={8}
                      >
                        <MoreVerticalIcon size={18} color={colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {isMenuOpen && (
                    <View style={[styles.memberMenu, !isLast && styles.memberBorder]}>
                      <Pressable style={styles.menuItem} onPress={() => handleToggleRole(member)}>
                        <SwapIcon size={16} color={colors.textPrimary} />
                        <Typography preset="body">
                          {member.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                        </Typography>
                      </Pressable>
                      <Pressable style={styles.menuItem} onPress={() => handleRemoveMember(member)}>
                        <UserMinusIcon size={16} color={colors.error} />
                        <Typography preset="body" color={colors.error}>Remove from group</Typography>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        </View>

        {/* ── Danger zone ───────────────────────────────────────── */}
        <View style={styles.dangerZone}>
          {!isOwner ? (
            <Pressable onPress={handleLeave} hitSlop={8}>
              <Typography preset="body" color={colors.error} style={styles.dangerText}>Leave Group</Typography>
            </Pressable>
          ) : (
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Typography preset="body" color={colors.error} style={styles.dangerText}>Delete Group</Typography>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    scroll: { paddingBottom: spacing[10] },

    // Hero
    hero: { alignItems: 'center', paddingTop: spacing[4], paddingBottom: spacing[6], gap: spacing[2] },
    heroAvatar: { width: HERO_AVATAR_SIZE, height: HERO_AVATAR_SIZE, borderRadius: HERO_AVATAR_SIZE / 2 },
    heroName: { textAlign: 'center' },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },

    // Quick actions
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[3],
      paddingHorizontal: layout.screenPaddingH,
      marginBottom: spacing[5],
    },
    actionPill: {
      alignItems: 'center',
      gap: spacing[1],
      backgroundColor: colors.primarySurface,
      borderRadius: layout.cardRadius,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[6],
    },
    actionLabel: { fontWeight: '500' },

    // Cards
    section: { marginHorizontal: layout.screenPaddingH, marginBottom: spacing[3] },
    sectionLabel: { marginBottom: spacing[2], letterSpacing: 0.5 },

    // Section blocks
    sectionBlock: { marginHorizontal: layout.screenPaddingH, marginBottom: spacing[5] },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    emptyText: { marginTop: spacing[1] },

    // Plans
    planCard: { marginBottom: spacing[2] },
    planTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    planBar: { marginTop: spacing[2] },
    flex: { flex: 1 },

    // Members
    memberCard: { padding: 0, overflow: 'hidden' },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    memberBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    adminBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: spacing[1],
      backgroundColor: colors.primarySurface,
    },
    memberMenu: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[1],
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingVertical: spacing[3],
    },

    // Danger
    dangerZone: { alignItems: 'center', paddingVertical: spacing[4] },
    dangerText: { textAlign: 'center' },
  });
