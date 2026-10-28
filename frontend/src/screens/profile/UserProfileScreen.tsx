import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { ReportReason, StudySet } from '../../types';
import {
  QMAvatar, QMBackButton, QMButton, QMConfirmDialog, QMEmpty, QMInput, QMSheet, qmRowEnter, type QMSheetAction,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { BlockIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, FlagIcon, InfoIcon, LeafIcon, MoreHorizontalIcon, UserMinusIcon } from '../../components/icons';
import { useUser } from '../../hooks/useUser';
import { useUserSets } from '../../hooks/useSets';
import {
  useAcceptFriendRequest, useBlockUser, useCancelFriendRequest, useRejectFriendRequest, useRemoveFriend, useSendFriendRequest,
} from '../../hooks/useFriends';
import { useConfirmDialog, useReportUser, useTabBarSpace } from '../../hooks';
import { getErrorMessage } from '../../api/client';
import { qmAccent, radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'UserProfile'>;
type Sheet = 'menu' | 'friend' | 'report' | 'thanks' | null;

const REASONS: ReportReason[] = ['HATEFUL', 'SPAM', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER'];
const AVATAR = 104;
const TOUCH = 44;
const BTN_H = 52;
const RADIO = 22;
const STRIPE_W = 10;
const STRIPE_H = 40;
const NOTE_MAX = 500;

export function UserProfileScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { qm, name: themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { userId } = route.params;

  const { data: user, isLoading, isFetching, isError, refetch } = useUser(userId);
  const { data: sets = [], refetch: refetchSets } = useUserSets(userId);
  const sendRequest = useSendFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const report = useReportUser();
  const { show, dialogProps } = useConfirmDialog();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [reason, setReason] = useState<ReportReason>('HATEFUL');
  const [note, setNote] = useState('');

  const back = (
    <View style={[styles.topRow, { paddingTop: insets.top + spacing.sm }]}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmPerson.back')} />
    </View>
  );

  if (isLoading) {
    return <View style={[styles.flex, { backgroundColor: qm.bg }]}>{back}<ActivityIndicator color={qm.violet} style={styles.loading} /></View>;
  }
  if (isError || !user) {
    return (
      <View style={[styles.flex, styles.pad, { backgroundColor: qm.bg }]}>
        {back}
        <QMEmpty icon={InfoIcon} title={t('profile:qmPerson.loadFailed')} action={{ label: t('profile:qmPerson.tryAgain'), onPress: () => refetch() }} />
      </View>
    );
  }

  const first = user.name.split(' ')[0];
  const toastErr = (e: unknown) => Toast.show({ type: 'error', text1: getErrorMessage(e) });
  const pending = user.pendingRequest;

  const confirmBlock = () => show({
    title: t('profile:qmFriends.blockTitle', { name: first }),
    message: t('profile:qmFriends.blockText'),
    confirmLabel: t('profile:qmFriends.blockBtn'),
    cancelLabel: t('profile:qmFriends.cancel'),
    variant: 'danger',
    onConfirm: () => blockUser.mutate(userId, {
      onSuccess: () => { Toast.show({ type: 'success', text1: t('profile:qmPerson.blocked', { name: first }) }); navigation.goBack(); },
      onError: toastErr,
    }),
  });

  const confirmRemove = () => show({
    title: t('profile:qmFriends.removeTitle', { name: first }),
    message: t('profile:qmFriends.removeText'),
    confirmLabel: t('profile:qmFriends.removeBtn'),
    cancelLabel: t('profile:qmFriends.cancel'),
    variant: 'danger',
    onConfirm: () => removeFriend.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmPerson.removed', { name: first }) }),
      onError: toastErr,
    }),
  });

  const openReport = () => { setReason('HATEFUL'); setNote(''); setSheet('report'); };

  const sendReport = () => report.mutate(
    { reportedId: userId, reason, note: note.trim() || undefined },
    { onSuccess: () => setSheet('thanks'), onError: toastErr },
  );

  const menuActions: QMSheetAction[] = sheet === 'friend' ? [
    { label: t('profile:qmPerson.remove'), icon: UserMinusIcon, danger: true, onPress: confirmRemove },
    { label: t('profile:qmPerson.block'), icon: BlockIcon, danger: true, onPress: confirmBlock },
    { label: t('profile:qmPerson.report'), icon: FlagIcon, onPress: openReport },
  ] : [
    { label: t('profile:qmPerson.reportName', { name: first }), icon: FlagIcon, onPress: openReport },
    { label: t('profile:qmPerson.blockName', { name: first }), icon: BlockIcon, danger: true, onPress: confirmBlock },
  ];

  const openSet = (set: StudySet) =>
    navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: set.id, setTitle: set.title, isOwner: false, preview: { ...set, user: set.user ?? { id: user.id, name: user.name } }, from: 'ProfileTab', back: { screen: 'UserProfile', params: { userId } } }, initial: false });

  const since = new Date(user.createdAt).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const dark = themeName === 'dark';

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl + tabSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { refetch(); refetchSets(); }}tintColor={qm.violet} progressViewOffset={insets.top} />}
      >
        <View style={styles.topRow}>
          <QMBackButton onPress={navigation.goBack} label={t('profile:qmPerson.back')} />
          <AnimatedPressable scaleTo={0.95} onPress={() => setSheet('menu')} style={[styles.touch, { backgroundColor: qm.field }]} accessibilityRole="button" accessibilityLabel={t('profile:qmPerson.more')}>
            <MoreHorizontalIcon size={19} color={qm.ink} />
          </AnimatedPressable>
        </View>

        <Animated.View entering={qmRowEnter(0)} style={styles.head}>
          <QMAvatar uri={user.profileImage} name={user.name} size={AVATAR} />
          <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.name}>{user.name}</Typography>
          {user.church ? <Typography preset="qmBodyMd" color={qm.muted} align="center">{user.church}</Typography> : null}
          {user.bio ? <Typography preset="qmVerse" color={qm.body} align="center" style={styles.bio}>{`“${user.bio}”`}</Typography> : null}
          <View style={styles.chips}>
            {user.mutualFriendsCount > 0 && (
              <View style={[styles.chip, { backgroundColor: qm.lilac }]}>
                <Typography preset="qmChip" color={qm.lilacInk}>{t('profile:qmPerson.mutual', { count: user.mutualFriendsCount })}</Typography>
              </View>
            )}
            <View style={[styles.chip, { backgroundColor: qm.field }]}>
              <Typography preset="qmChip" color={qm.muted}>{t('profile:qmPerson.since', { date: since })}</Typography>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={qmRowEnter(1)} style={styles.actions}>
          {user.isFriend ? (
            <AnimatedPressable
              scaleTo={0.97}
              onPress={() => setSheet('friend')}
              style={[styles.btn, styles.friendBtn, { backgroundColor: qm.leafBg, borderColor: qm.leaf }]}
              accessibilityRole="button"
              accessibilityLabel={t('profile:qmPerson.friendsA11y')}
            >
              <CheckIcon size={16} color={qm.leafText} strokeWidth={2.6} />
              <Typography preset="qmButton" color={qm.leafText}>{t('profile:qmPerson.friends')}</Typography>
              <ChevronDownIcon size={16} color={qm.leafText} strokeWidth={2.2} />
            </AnimatedPressable>
          ) : pending?.direction === 'outgoing' ? (
            <AnimatedPressable
              scaleTo={0.97}
              disabled={cancelRequest.isPending}
              onPress={() => cancelRequest.mutate(pending.id, { onSuccess: () => Toast.show({ type: 'info', text1: t('profile:qmPerson.cancelled') }), onError: toastErr })}
              style={[styles.btn, { backgroundColor: qm.field }]}
              accessibilityRole="button"
            >
              <Typography preset="qmButton" color={qm.ink}>{t('profile:qmPerson.requested')}</Typography>
            </AnimatedPressable>
          ) : pending?.direction === 'incoming' ? (
            <>
              <AnimatedPressable
                scaleTo={0.97}
                onPress={() => rejectRequest.mutate(pending.id, { onSuccess: () => Toast.show({ type: 'info', text1: t('profile:qmPerson.declined') }), onError: toastErr })}
                style={[styles.btn, { backgroundColor: qm.field }]}
                accessibilityRole="button"
              >
                <Typography preset="qmButton" color={qm.ink}>{t('profile:qmPerson.decline')}</Typography>
              </AnimatedPressable>
              <AnimatedPressable
                scaleTo={0.97}
                onPress={() => acceptRequest.mutate(pending.id, { onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmPerson.nowFriends') }), onError: toastErr })}
                style={[styles.btn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}
                accessibilityRole="button"
              >
                <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmPerson.accept')}</Typography>
              </AnimatedPressable>
            </>
          ) : (
            <AnimatedPressable
              scaleTo={0.97}
              disabled={sendRequest.isPending}
              onPress={() => sendRequest.mutate(userId, { onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmPerson.requestSent') }), onError: toastErr })}
              style={[styles.btn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}
              accessibilityRole="button"
            >
              <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmPerson.add')}</Typography>
            </AnimatedPressable>
          )}
        </Animated.View>

        {sets.length > 0 && (
          <>
            <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t('profile:qmPerson.setsTitle', { name: first.toUpperCase() })}</Typography>
            <View style={styles.sets}>
              {sets.map((set, i) => {
                const [, stripe] = qmAccent(qm, dark, set.color ?? qm.setColors[i % qm.setColors.length]);
                return (
                  <Animated.View key={set.id} entering={qmRowEnter(i + 2)}>
                    <AnimatedPressable scaleTo={0.98} onPress={() => openSet(set)} style={[styles.setRow, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]} accessibilityRole="button">
                      <View style={[styles.stripe, { backgroundColor: stripe }]} />
                      <View style={styles.flex}>
                        <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{set.title}</Typography>
                        <Typography preset="qmMeta" color={qm.muted} style={styles.setMeta}>
                          {t('profile:qmPerson.cards', { count: set._count?.cards ?? 0 })} · {t(`profile:qmPerson.vis${set.visibility}`)}
                        </Typography>
                      </View>
                      <ChevronRightIcon size={16} color={qm.muted} strokeWidth={2} />
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <QMSheet
        visible={sheet === 'menu' || sheet === 'friend'}
        onClose={() => setSheet(s => (s === 'menu' || s === 'friend' ? null : s))}
        title={sheet === 'friend' ? t('profile:qmPerson.friendsWith', { name: first }) : undefined}
        actions={menuActions}
      />

      <QMSheet
        visible={sheet === 'report' || sheet === 'thanks'}
        onClose={() => setSheet(null)}
        title={sheet === 'report' ? t('profile:qmPerson.reportTitle') : undefined}
        sub={sheet === 'report' ? t('profile:qmPerson.reportSub', { name: first }) : undefined}
      >
        {sheet === 'report' ? (
          <View style={styles.sheetBody}>
            {REASONS.map((r, i) => {
              const on = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  style={[styles.reason, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <Typography preset="qmRow" color={qm.ink} style={styles.flex}>{t(`profile:qmPerson.reason${r}`)}</Typography>
                  <View style={[styles.radio, on ? [styles.radioOn, { borderColor: qm.violet }] : [styles.radioOff, { borderColor: qm.off }]]} />
                </Pressable>
              );
            })}
            <View style={styles.note}>
              <QMInput
                value={note}
                onChangeText={setNote}
                placeholder={t('profile:qmPerson.notePh')}
                maxLength={NOTE_MAX}
                multiline
                fill={qm.bg}
              />
            </View>
            <QMButton label={t('profile:qmPerson.send')} onPress={sendReport} loading={report.isPending} style={styles.send} />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)} style={styles.thanks}>
            <LeafIcon size={48} color={qm.leaf} strokeWidth={1.4} />
            <Typography preset="qmSheetTitle" color={qm.ink} align="center" style={styles.thanksTitle}>{t('profile:qmPerson.thanksTitle')}</Typography>
            <Typography preset="qmBodyMd" color={qm.muted} align="center">{t('profile:qmPerson.thanksText')}</Typography>
            <View style={styles.thanksBtns}>
              <AnimatedPressable scaleTo={0.97} onPress={() => setSheet(null)} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
                <Typography preset="qmButton" color={qm.ink}>{t('profile:qmPerson.done')}</Typography>
              </AnimatedPressable>
              <AnimatedPressable scaleTo={0.97} onPress={() => { setSheet(null); confirmBlock(); }} style={[styles.btn, { backgroundColor: qm.errorBg }]} accessibilityRole="button">
                <Typography preset="qmButton" color={qm.error}>{t('profile:qmPerson.blockName', { name: first })}</Typography>
              </AnimatedPressable>
            </View>
          </Animated.View>
        )}
      </QMSheet>

      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pad: { paddingHorizontal: spacing.xl },
  loading: { marginTop: spacing.xxxl },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  touch: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', marginTop: spacing.xs },
  name: { marginTop: spacing.s14, marginBottom: spacing.xs },
  bio: { marginTop: spacing.md, maxWidth: 300, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.s14 },
  chip: { borderRadius: radius.pill, paddingVertical: spacing.s6, paddingHorizontal: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.xl },
  btn: { flex: 1, height: BTN_H, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  friendBtn: { borderWidth: 1 },
  section: { marginTop: spacing.s28, marginBottom: spacing.s10, marginHorizontal: spacing.xs },
  sets: { gap: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r17 + 1 },
  stripe: { width: STRIPE_W, height: STRIPE_H, borderRadius: STRIPE_W / 2 },
  setMeta: { marginTop: spacing.s2 },
  reason: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: spacing.md },
  radio: { width: RADIO, height: RADIO, borderRadius: RADIO / 2 },
  radioOn: { borderWidth: 7 },
  radioOff: { borderWidth: 2 },
  note: { marginTop: spacing.md },
  send: { marginTop: spacing.s14 },
  sheetBody: { paddingHorizontal: spacing.s10 },
  thanks: { alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.s10 },
  thanksTitle: { marginTop: spacing.s10, marginBottom: spacing.s6 },
  thanksBtns: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.lg, alignSelf: 'stretch' },
});
