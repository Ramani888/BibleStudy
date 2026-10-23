import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { FriendRequest } from '../../types/friends.types';
import { QMAvatar, QMBackButton, QMEmpty, QMSegmented, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { InfoIcon, LeafIcon } from '../../components/icons';
import { useAcceptFriendRequest, useCancelFriendRequest, useFriendRequests, useRejectFriendRequest } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import { formatRelativeShort } from '../../utils/formatters';
import { radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'FriendRequests'>;
type Tab = 'incoming' | 'outgoing';

const AVATAR = 46;
const BTN_H = 44;

export function FriendRequestsScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('incoming');
  // Accepted rows stay a moment with a "You're now friends" line before the list refetches them away.
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const { data: incoming = [] } = useFriendRequests('incoming');
  const { data: requests = [], isLoading, isFetching, isError, refetch } = useFriendRequests(tab);
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();
  const cancel = useCancelFriendRequest();

  const onError = (e: unknown) => Toast.show({ type: 'error', text1: getErrorMessage(e) });

  const handleAccept = useCallback((id: string) => {
    accept.mutate(id, {
      onSuccess: () => {
        setAccepted(prev => new Set(prev).add(id));
        Toast.show({ type: 'success', text1: t('profile:qmRequests.nowFriends') });
      },
      onError,
    });
  }, [accept, t]);

  const handleDecline = useCallback((id: string) => {
    reject.mutate(id, { onSuccess: () => Toast.show({ type: 'info', text1: t('profile:qmRequests.declined') }), onError });
  }, [reject, t]);

  const handleCancel = useCallback((id: string) => {
    cancel.mutate(id, { onSuccess: () => Toast.show({ type: 'info', text1: t('profile:qmRequests.cancelled') }), onError });
  }, [cancel, t]);

  const renderItem = useCallback(({ item, index }: { item: FriendRequest; index: number }) => {
    const person = tab === 'incoming' ? item.sender : item.receiver;
    if (!person) return null;
    const when = formatRelativeShort(item.createdAt);
    const sub = tab === 'outgoing' ? t('profile:qmRequests.sentOn', { date: when }) : person.church ? `${person.church} · ${when}` : when;
    const done = accepted.has(item.id);
    return (
      <Animated.View entering={qmRowEnter(index)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        <AnimatedPressable
          scaleTo={0.98}
          onPress={() => navigation.navigate('UserProfile', { userId: person.id })}
          style={styles.who}
          accessibilityRole="button"
          accessibilityLabel={person.name}
        >
          <QMAvatar uri={person.profileImage} name={person.name} size={AVATAR} />
          <View style={styles.flex}>
            <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{person.name}</Typography>
            <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.sub}>{sub}</Typography>
          </View>
        </AnimatedPressable>
        {done ? (
          <Animated.View entering={FadeIn.duration(250)} style={[styles.friends, { backgroundColor: qm.leafBg }]}>
            <LeafIcon size={16} color={qm.leaf} filled />
            <Typography preset="qmFieldLabel" color={qm.leafText}>{t('profile:qmRequests.nowFriends')}</Typography>
          </Animated.View>
        ) : (
          <View style={styles.btnRow}>
            {tab === 'incoming' ? (
              <>
                <AnimatedPressable scaleTo={0.97} onPress={() => handleDecline(item.id)} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
                  <Typography preset="qmButton" color={qm.ink}>{t('profile:qmRequests.decline')}</Typography>
                </AnimatedPressable>
                <AnimatedPressable scaleTo={0.97} onPress={() => handleAccept(item.id)} style={[styles.btn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
                  <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmRequests.accept')}</Typography>
                </AnimatedPressable>
              </>
            ) : (
              <AnimatedPressable scaleTo={0.97} onPress={() => handleCancel(item.id)} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
                <Typography preset="qmButton" color={qm.ink}>{t('profile:qmRequests.cancelReq')}</Typography>
              </AnimatedPressable>
            )}
          </View>
        )}
      </Animated.View>
    );
  }, [tab, qm, accepted, navigation, handleAccept, handleDecline, handleCancel, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmRequests.back')} />
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmRequests.title')}</Typography>
      <QMSegmented<Tab>
        label={t('profile:qmRequests.title')}
        value={tab}
        onChange={setTab}
        options={[
          { key: 'incoming', label: incoming.length > 0 ? `${t('profile:qmRequests.forYou')}  ·  ${incoming.length}` : t('profile:qmRequests.forYou') },
          { key: 'outgoing', label: t('profile:qmRequests.sent') },
        ]}
      />
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmRequests.loadFailed')} action={{ label: t('profile:qmRequests.tryAgain'), onPress: () => refetch() }} />;
  else empty = <QMEmpty icon={LeafIcon} title={t('profile:qmRequests.emptyTitle')} text={tab === 'incoming' ? t('profile:qmRequests.emptyIn') : t('profile:qmRequests.emptyOut')} />;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isError ? [] : requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={accepted}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
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
  listGap: { height: spacing.lg },
  card: { paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r20 },
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sub: { marginTop: spacing.s2 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, height: BTN_H, borderRadius: radius.r12 + 2, alignItems: 'center', justifyContent: 'center' },
  friends: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, paddingVertical: spacing.s10, paddingHorizontal: spacing.md, borderRadius: radius.r12 },
  sep: { height: spacing.s10 },
  loading: { marginTop: spacing.xxxl },
});
