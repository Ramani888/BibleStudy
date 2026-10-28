import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { UserProfile } from '../../types/friends.types';
import { QMAvatar, QMBackButton, QMEmpty, QMSearchField, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CheckIcon, ClockIcon, InfoIcon, PlusIcon, SearchIcon, type IconComponent } from '../../components/icons';
import { useAcceptFriendRequest, useSearchUsers, useSendFriendRequest } from '../../hooks/useFriends';
import { useDebouncedValue, useReferral, useTabBarSpace } from '../../hooks';
import { getErrorMessage } from '../../api/client';
import { loadFailed } from '../../utils/queryState';
import { radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'SearchUsers'>;
type Status = 'friend' | 'incoming' | 'sent' | 'none';

const AVATAR = 44;
const BTN_H = 40;
const MIN_CHARS = 2;

export function SearchUsersScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim(), 300);
  // Local overrides so a tap shows its result before the search refetches.
  const [local, setLocal] = useState<Record<string, Status>>({});
  const searchQuery = useSearchUsers(q);
  const { data: users = [], isFetching, refetch } = searchQuery;
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const { data: referral } = useReferral();

  const statusOf = useCallback((u: UserProfile): Status =>
    local[u.id] ?? (u.isFriend ? 'friend' : u.pendingRequest?.direction === 'incoming' ? 'incoming' : u.pendingRequest ? 'sent' : 'none'), [local]);

  const act = useCallback((u: UserProfile, s: Status) => {
    const onError = (e: unknown) => Toast.show({ type: 'error', text1: getErrorMessage(e) });
    if (s === 'none') {
      sendRequest.mutate(u.id, {
        onSuccess: () => { setLocal(p => ({ ...p, [u.id]: 'sent' })); Toast.show({ type: 'success', text1: t('profile:qmSearch.sentTo', { name: u.name }) }); },
        onError,
      });
    } else if (s === 'incoming' && u.pendingRequest) {
      accept.mutate(u.pendingRequest.id, { onSuccess: () => setLocal(p => ({ ...p, [u.id]: 'friend' })), onError });
    }
  }, [sendRequest, accept, t]);

  const look = useMemo<Record<Status, [string, string, string, IconComponent]>>(() => ({
    friend: [t('profile:qmSearch.friends'), qm.leafBg, qm.leafText, CheckIcon],
    incoming: [t('profile:qmSearch.accept'), qm.violet, qm.onViolet, CheckIcon],
    sent: [t('profile:qmSearch.requested'), qm.field, qm.muted, ClockIcon],
    none: [t('profile:qmSearch.add'), qm.lilac, qm.link, PlusIcon],
  }), [qm, t]);

  const renderItem = useCallback(({ item, index }: { item: UserProfile; index: number }) => {
    const s = statusOf(item);
    const [label, bg, ink, Icon] = look[s];
    const idle = s === 'friend' || s === 'sent';
    const sub = s === 'friend'
      ? (local[item.id] ? t('profile:qmSearch.nowFriends') : t('profile:qmSearch.alreadyFriends'))
      : s === 'incoming' ? t('profile:qmSearch.wantsYou') : item.church;
    return (
      <Animated.View entering={qmRowEnter(index)} style={[styles.row, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        <AnimatedPressable
          scaleTo={0.98}
          onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          style={styles.who}
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <QMAvatar uri={item.profileImage} name={item.name} size={AVATAR} />
          <View style={styles.flex}>
            <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{item.name}</Typography>
            {sub ? <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.sub}>{sub}</Typography> : null}
          </View>
        </AnimatedPressable>
        <AnimatedPressable
          scaleTo={0.95}
          disabled={idle || sendRequest.isPending || accept.isPending}
          onPress={() => act(item, s)}
          style={[styles.btn, { backgroundColor: bg }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: idle }}
          accessibilityLabel={`${label}, ${item.name}`}
        >
          <Icon size={15} color={ink} strokeWidth={2.2} />
          <Typography preset="qmLink" color={ink}>{label}</Typography>
        </AnimatedPressable>
      </Animated.View>
    );
  }, [qm, statusOf, look, local, navigation, act, sendRequest.isPending, accept.isPending, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmSearch.back')} />
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmSearch.title')}</Typography>
      <QMSearchField value={query} onChangeText={setQuery} placeholder={t('profile:qmSearch.placeholder')} autoFocus />
      {q.length < MIN_CHARS && <Typography preset="qmMeta" color={qm.muted} style={styles.hint}>{t('profile:qmSearch.hint')}</Typography>}
      {isFetching && q.length >= MIN_CHARS && <ActivityIndicator size="small" color={qm.violet} style={styles.spinner} />}
      <View style={styles.listGap} />
    </View>
  );

  const searched = q.length >= MIN_CHARS;
  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={searched ? users : []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={local}
        ListHeaderComponent={header}
        ListEmptyComponent={searched && loadFailed(searchQuery) // offline → "did not load", not "No one by that name"
          ? <QMEmpty icon={InfoIcon} title={t('profile:qmSearch.searchFailed')} action={{ label: t('profile:qmFriends.tryAgain'), onPress: () => refetch() }} />
          : searched && !isFetching
          ?<QMEmpty icon={SearchIcon} title={t('profile:qmSearch.noMatchTitle')} text={t('profile:qmSearch.noMatchText')} action={{ label: t('profile:qmFriends.invite', { count: referral?.rewardPerReferral ?? 5 }), onPress: () => navigation.navigate('InviteFriends') }} />
          : null}
        ListFooterComponent={searched && users.length > 0
          ? <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.privacy}>{t('profile:qmSearch.privacy')}</Typography>
          : null}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxxl + tabSpace }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1 },
  h1: { marginTop: spacing.s6, marginBottom: spacing.s14 },
  hint: { marginTop: spacing.sm, marginHorizontal: spacing.xs },
  spinner: { marginTop: spacing.md },
  listGap: { height: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.s10, paddingLeft: spacing.md, paddingRight: spacing.s10, borderRadius: radius.r17 + 1 },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sub: { marginTop: spacing.s2 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, height: BTN_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 },
  sep: { height: spacing.sm },
  privacy: { marginTop: spacing.s18, marginHorizontal: spacing.s6 },
});
