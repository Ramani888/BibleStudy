import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMEmpty, QMSearchField, QMSetRow, qmRowEnter } from '../../../components/qm';
import { AnimatedPressable, Typography } from '../../../components/ui';
import { CheckIcon, ChevronLeftIcon, FriendsIcon, PlusIcon, RefreshIcon, SearchIcon } from '../../../components/icons';
import { useCloneSet, useDebouncedValue, useFriendsSets, usePublicSets } from '../../../hooks';
import { useAuthStore } from '../../../store';
import { getErrorMessage } from '../../../api';
import { useTheme, spacing, radius } from '../../../theme';
import type { AppTabParamList, LibraryStackParamList } from '../../../navigation/types';
import type { StudySet } from '../../../types';

const TOUCH = 44;
const ADD_H = 38;

type Nav = NavigationProp<LibraryStackParamList & AppTabParamList>;

/** Explore (public) and Friends' sets share one screen (canvas PublicSets, `kind` explore/friends). */
export function SetBrowser({ kind }: { kind: 'explore' | 'friends' }) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const friends = kind === 'friends';
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const { mutate: cloneSet } = useCloneSet();
  const myId = useAuthStore(st => st.user?.id);

  // Explore searches on the server; Friends' sets are a short list, filtered here.
  const publicQuery = usePublicSets(friends ? undefined : debounced || undefined);
  const friendsQuery = useFriendsSets();
  const query = friends ? friendsQuery : publicQuery;
  const { data, isLoading, isRefetching, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const all = useMemo(() => data?.pages.flatMap(p => p.sets) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;
  const q = search.trim().toLowerCase();
  const sets = useMemo(() => (friends && q ? all.filter(s => s.title.toLowerCase().includes(q)) : all), [all, friends, q]);
  const searching = friends ? !!q : !!debounced;

  const add = useCallback((set: StudySet) => {
    setAdding(set.id);
    cloneSet(set.id, {
      onSuccess: () => {
        setAdded(a => ({ ...a, [set.id]: true }));
        Toast.show({ type: 'success', text1: t('library:qm.addedToLibrary', { title: set.title, defaultValue: `Added “${set.title}” to your library` }) });
      },
      onError: err => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
      onSettled: () => setAdding(null),
    });
  }, [cloneSet, t]);

  const renderItem = useCallback(({ item, index }: { item: StudySet; index: number }) => {
    const count = item._count?.cards ?? 0;
    const done = !!added[item.id];
    const meta = item.user?.name
      ? `${t('library:cards.cardCount', { count })} · ${t('library:qm.byName', { name: item.user.name })}`
      : t('library:cards.cardCount', { count });
    return (
      <Animated.View entering={qmRowEnter(index)}>
        <QMSetRow
          title={item.title}
          color={item.color}
          meta={meta}
          onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: item.userId === myId, preview: item })}
          right={item.userId === myId ? undefined : (
            <AnimatedPressable
              scaleTo={0.92}
              disabled={done || adding === item.id}
              onPress={() => add(item)}
              style={[styles.add, { backgroundColor: done ? qm.leafBg : qm.lilac }]}
              accessibilityRole="button"
              accessibilityLabel={done
                ? t('library:qm.inLibraryA11y', { title: item.title, defaultValue: `${item.title} is in your library` })
                : t('library:qm.addToLibraryA11y', { title: item.title, defaultValue: `Add ${item.title} to your library` })}
            >
              {adding === item.id ? <ActivityIndicator size="small" color={qm.lilacInk} />
                : done ? <Animated.View entering={FadeIn.duration(250)}><CheckIcon size={15} color={qm.leafText} strokeWidth={3} /></Animated.View>
                : <PlusIcon size={15} color={qm.lilacInk} strokeWidth={2.6} />}
              <Typography preset="qmLabel" color={done ? qm.leafText : qm.lilacInk} style={styles.addText}>
                {done ? t('library:qm.added', 'Added') : t('library:qm.add', 'Add')}
              </Typography>
            </AnimatedPressable>
          )}
        />
      </Animated.View>
    );
  }, [added, adding, add, myId, navigation, qm, t]);

  const subtitle = friends
    ? (total ? t('library:qm.friendsCount', { count: total, defaultValue: `${total} sets shared by your friends` }) : t('library:qm.friendsSub', 'Sets your friends share with you'))
    : (total ? t('library:qm.publicCount', { count: total, defaultValue: `${total} public sets from the community` }) : t('library:qm.publicSub', 'Public sets from the community'));

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable onPress={navigation.goBack} style={({ pressed }) => [styles.back, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('common:actions.back', 'Back')}>
        <ChevronLeftIcon size={20} color={qm.ink} />
      </Pressable>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>
        {friends ? t('library:qm.friendsTitle', 'Friends’ sets') : t('library:qm.exploreTitle', 'Explore sets')}
      </Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>{subtitle}</Typography>
      {(all.length > 0 || searching) && (
        <View style={styles.search}>
          <QMSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={friends ? t('library:qm.searchFriendsSets', 'Search friends’ sets') : t('library:qm.searchPublic', 'Search public sets')}
          />
        </View>
      )}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={RefreshIcon}
        title={t('library:qm.browseFailedTitle', 'These sets did not load')}
        text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
        action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: () => refetch() }} />
    );
  } else if (searching) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={SearchIcon}
        title={t('library:qm.noSetsMatch', 'No sets match')}
        text={t('library:qm.noMatchText', { query: search.trim() })}
        action={{ label: t('library:qm.clearSearch', 'Clear search'), onPress: () => setSearch('') }} />
    );
  } else if (friends) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={FriendsIcon}
        title={t('library:qm.noFriendsSets', 'No friends’ sets yet')}
        text={t('library:qm.noFriendsSetsText', 'When your friends mark sets as Friends, they’ll show here.')}
        action={{ label: t('library:qm.findFriends', 'Find friends'), onPress: () => navigation.navigate('ProfileTab', { screen: 'Friends' }) }} />
    );
  } else {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={SearchIcon}
        title={t('library:publicSets.emptyTitle', 'No public sets yet')}
        text={t('library:qm.noPublicText', 'Check back soon. New sets from the community show up here.')} />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isLoading || isError ? [] : sets}
        keyExtractor={s => s.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={qm.violet} style={styles.more} /> : null}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dim: { opacity: 0.6 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  header: { paddingBottom: spacing.lg },
  back: { width: TOUCH, height: TOUCH, marginLeft: -spacing.s10, alignItems: 'center', justifyContent: 'center' },
  h1: { marginTop: spacing.s10, marginBottom: spacing.xs },
  search: { marginTop: spacing.lg },
  sep: { height: spacing.s10 },
  add: {
    height: ADD_H, paddingHorizontal: spacing.s14, borderRadius: radius.pill, marginRight: spacing.s6,
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
  },
  addText: { fontSize: 14 },
  loading: { marginTop: spacing.huge },
  emptyGap: { marginTop: spacing.s48 },
  more: { marginVertical: spacing.lg },
});
