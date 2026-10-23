import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { BlockedUser } from '../../types/friends.types';
import { QMBackButton, QMEmpty, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { InfoIcon, LeafIcon } from '../../components/icons';
import { useBlockedUsers, useUnblockUser } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import { initialsOf } from '../../components/qm/QMAvatar';
import { formatDateOnly } from '../../utils/formatters';
import { loadFailed } from '../../utils/queryState';
import { qmFont, radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'BlockedUsers'>;

const AVATAR = 44;
const BTN_H = 40;

export function BlockedUsersScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const blockedQuery = useBlockedUsers();
  const { data: blocked = [], isLoading, isFetching, refetch } = blockedQuery;
  const isError = loadFailed(blockedQuery); // offline with nothing cached → "did not load", not the empty state
  const unblock = useUnblockUser();

  const handleUnblock = useCallback((item: BlockedUser) => {
    unblock.mutate(item.blockedId, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmBlocked.unblocked', { name: item.blocked.name.split(' ')[0] }) }),
      onError: e => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  }, [unblock, t]);

  // Muted grey initials, never their photo: a blocked person shouldn't look inviting here.
  const renderItem = useCallback(({ item, index }: { item: BlockedUser; index: number }) => (
    <Animated.View entering={qmRowEnter(index)} style={[styles.row, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <View style={[styles.avatar, { backgroundColor: qm.field }]}>
        <Typography style={[styles.initials, { color: qm.muted }]}>{initialsOf(item.blocked.name)}</Typography>
      </View>
      <View style={styles.flex}>
        <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{item.blocked.name}</Typography>
        <Typography preset="qmMeta" color={qm.muted} style={styles.sub}>{t('profile:qmBlocked.since', { date: formatDateOnly(item.createdAt) })}</Typography>
      </View>
      <AnimatedPressable
        scaleTo={0.95}
        disabled={unblock.isPending}
        onPress={() => handleUnblock(item)}
        style={[styles.btn, { backgroundColor: qm.lilac }]}
        accessibilityRole="button"
        accessibilityLabel={`${t('profile:qmBlocked.unblock')} ${item.blocked.name}`}
      >
        <Typography preset="qmLink" color={qm.link}>{t('profile:qmBlocked.unblock')}</Typography>
      </AnimatedPressable>
    </Animated.View>
  ), [qm, unblock.isPending, handleUnblock, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmBlocked.back')} />
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmBlocked.title')}</Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>{t('profile:qmBlocked.lead')}</Typography>
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmBlocked.loadFailed')} action={{ label: t('profile:qmBlocked.tryAgain'), onPress: () => refetch() }} />;
  else empty = <QMEmpty icon={LeafIcon} title={t('profile:qmBlocked.emptyTitle')} text={t('profile:qmBlocked.emptyText')} />;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isError ? [] : blocked}
        keyExtractor={item => item.id}
        renderItem={renderItem}
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
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  listGap: { height: spacing.s18 },
  loading: { marginTop: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.s10, paddingLeft: spacing.md, paddingRight: spacing.s10, borderRadius: radius.r17 + 1 },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: qmFont.serifMedium, fontSize: 16, lineHeight: 20 },
  sub: { marginTop: spacing.s2 },
  btn: { height: BTN_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12, justifyContent: 'center' },
  sep: { height: spacing.sm },
});
