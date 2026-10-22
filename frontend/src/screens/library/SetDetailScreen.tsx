import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QuizModeSheet } from '../../components/domain';
import { QMConfirmDialog, QMEmpty, QMSheet, qmRowEnter, type QMSheetAction } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  ArrowRightIcon, AskIcon, CardsIcon, CheckIcon, ChevronLeftIcon, CopyIcon, DocIcon, EyeIcon, EyeOffIcon, GridIcon, GripIcon,
  InfoIcon, ListIcon, MoreVerticalIcon, OrderIcon, PencilIcon, PlayIcon, PlusIcon, RefreshIcon, SearchIcon, ShareUpIcon, TrashIcon,
} from '../../components/icons';
import {
  useCards, useCloneSet, useConfirmDialog, useCopyCard, useDeleteCard, useManualRefresh, useMastery, useMoveCard,
  useReorderCards, useSet, useSets, useUpdateCard,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { buildSetShareLink, shareToWhatsApp } from '../../utils';
import { useTheme, spacing, radius, textPresets, mixHex, qmAccent } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

const TOUCH = 44;
const BAR_H = 52;
const HERO_TOP = 60;     // canvas hero padding below the top bar
const ICON_BTN = 32;
const BTN_H = 52;
const SEG_W = 44;
const SEG_H = 34;
const TRACK_H = 8;
const AVATAR = 32;
const NOTE_MAX = 500;
const NOTE_MIN_H = 120;
const FROST = { light: 'rgba(255,255,255,0.6)', dark: 'rgba(0,0,0,0.2)' } as const;

type Sheet = 'set' | 'share' | 'card' | 'move' | 'note' | null;

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const dark = themeName === 'dark';
  const insets = useSafeAreaInsets();
  const { setId, setTitle, isOwner = true } = route.params;

  const [sheet, setSheet] = useState<Sheet>(null);
  const [target, setTarget] = useState<CardType | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('list');
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedCards, setOrderedCards] = useState<CardType[]>([]);
  const [masteryInfo, setMasteryInfo] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: cards = [], isLoading, isError, refetch } = useCards(setId);
  const { data: setData } = useSet(setId);
  const { data: allSets = [] } = useSets();
  const { data: masteryRows } = useMastery();
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const { mutateAsync: deleteCardAsync } = useDeleteCard(setId);
  const { mutate: copyCard } = useCopyCard(setId);
  const { mutate: moveCard } = useMoveCard(setId);
  const { mutate: updateCard, mutateAsync: updateCardAsync } = useUpdateCard(setId);
  const { mutate: reorderCards, isPending: isReordering } = useReorderCards();
  const { mutate: cloneSet, isPending: cloning } = useCloneSet();
  const { show, dialogProps } = useConfirmDialog();

  const set = setData ?? allSets.find(s => s.id === setId);
  const title = set?.title ?? setTitle;
  const mastery = masteryRows?.find(m => m.setId === setId);
  const [coverBg, coverInk] = useMemo(() => {
    const [, ink] = qmAccent(qm, dark, set?.color);
    return [set?.color ? mixHex(set.color, qm.bg, 0.14) : qm.lilac, ink];
  }, [qm, dark, set?.color]);
  const frost = dark ? FROST.dark : FROST.light;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const barBgStyle = useAnimatedStyle(() => ({ opacity: withTiming(scrollY.value > 80 ? 1 : 0, { duration: 200 }) }));

  const q = search.trim().toLowerCase();
  const shownCards = useMemo(
    () => (q ? cards.filter(c => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)) : cards),
    [cards, q],
  );
  const allBlurred = cards.length > 0 && cards.every(c => c.isBlurred);
  const visibilityLabel = set?.visibility === 'PUBLIC' ? t('library:sets.visibilityPublic', 'Public')
    : set?.visibility === 'FRIENDS' ? t('library:sets.visibilityFriends', 'Friends') : t('library:sets.private', 'Private');
  const setMeta = `${cards.length ? t('library:cards.cardCount', { count: cards.length }) : t('library:qm.noCardsYet', 'No cards yet')} · ${visibilityLabel}`;
  const otherSets = useMemo(() => allSets.filter(s => s.id !== setId), [allSets, setId]);

  const err = useCallback((e: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(e) }), [t]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const buildShareMessage = useCallback(() => {
    const cardList = cards.map((c, i) => `${i + 1}. ${c.question}\n   ${c.answer}`).join('\n\n');
    const divider = '─'.repeat(Math.min(title.length, 40));
    // PUBLIC sets link to a live preview page; others fall back to the homepage.
    const link = set ? buildSetShareLink(set) : 'https://getverdance.com';
    const footer = t('library:setDetail.shareFooter', { link, defaultValue: '📖 Studied with Verdance — grow in the Word: {{link}}' });
    return `${title}\n${divider}\n\n${cardList}\n\n${footer}`;
  }, [title, cards, set, t]);

  const toggleBlur = useCallback((card: CardType) => {
    updateCard({ id: card.id, payload: { isBlurred: !card.isBlurred } }, { onError: err });
  }, [updateCard, err]);

  const blurAll = useCallback(async (blur: boolean) => {
    const toUpdate = cards.filter(c => c.isBlurred !== blur);
    const results = await Promise.allSettled(toUpdate.map(c => updateCardAsync({ id: c.id, payload: { isBlurred: blur } })));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed === 0) {
      Toast.show({ type: 'success', text1: blur ? t('library:qm.answersHidden', 'All answers hidden') : t('library:qm.answersShown', 'All answers shown') });
    } else {
      Toast.show({ type: 'error', text1: t('library:cards.batchUpdateResult', { updated: toUpdate.length - failed, failed, defaultValue: `${toUpdate.length - failed} updated, ${failed} failed` }) });
    }
  }, [cards, updateCardAsync, t]);

  const deleteCard = useCallback((card: CardType) => {
    show({
      title: t('library:qm.deleteCardTitle', 'Delete this card?'),
      message: t('library:qm.deleteCardMessage', 'It will be gone from this set for good.'),
      confirmLabel: t('common:actions.delete', 'Delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCardAsync(card.id);
          Toast.show({ type: 'success', text1: t('library:cards.cardDeleted', 'Card deleted') });
        } catch (e) { err(e); }
      },
    });
  }, [show, deleteCardAsync, err, t]);

  const saveNote = useCallback(() => {
    if (!target) return;
    setSavingNote(true);
    updateCard({ id: target.id, payload: { note: noteText.trim() || null } }, {
      onSuccess: () => {
        setSavingNote(false);
        setSheet(null);
        Toast.show({ type: 'success', text1: t('library:cards.noteSaved', 'Note saved') });
      },
      onError: e => { setSavingNote(false); err(e); },
    });
  }, [target, noteText, updateCard, err, t]);

  const saveReorder = useCallback(() => {
    reorderCards({ setId, cardIds: orderedCards.map(c => c.id) }, {
      onSuccess: () => {
        setReorderMode(false);
        setOrderedCards([]);
        Toast.show({ type: 'success', text1: t('library:cards.orderSaved', 'Order saved') });
      },
      onError: err,
    });
  }, [reorderCards, setId, orderedCards, err, t]);

  const saveCopy = useCallback(() => {
    cloneSet(setId, {
      onSuccess: () => { setSaved(true); Toast.show({ type: 'success', text1: t('library:qm.savedCopy', 'Saved to your library') }); },
      onError: err,
    });
  }, [cloneSet, setId, err, t]);

  const openNote = useCallback((card: CardType) => { setTarget(card); setNoteText(card.note ?? ''); setSheet('note'); }, []);
  const openCardMenu = useCallback((card: CardType) => { setTarget(card); setSheet('card'); }, []);
  const addCard = useCallback(() => navigation.navigate('CreateCard', { setId }), [navigation, setId]);

  // ── Sheets ──────────────────────────────────────────────────────────────────
  const setActions: QMSheetAction[] = [
    { label: t('library:qm.addCard', 'Add a card'), icon: PlusIcon, onPress: addCard },
    { label: t('library:qm.editSet', 'Edit set'), icon: PencilIcon, onPress: () => navigation.navigate('EditSet', { setId }) },
    ...(cards.length ? [{
      label: allBlurred ? t('library:qm.showAllAnswers', 'Show all answers') : t('library:qm.hideAllAnswers', 'Hide all answers'),
      icon: allBlurred ? EyeIcon : EyeOffIcon,
      onPress: () => blurAll(!allBlurred),
    }] : []),
    ...(cards.length > 1 ? [{
      label: t('library:qm.reorderCards', 'Reorder cards'), icon: OrderIcon,
      onPress: () => { setOrderedCards([...cards]); setSearching(false); setSearch(''); setReorderMode(true); },
    }] : []),
  ];
  const shareActions: QMSheetAction[] = [
    { label: t('library:qm.shareWhatsApp', 'Share on WhatsApp'), icon: AskIcon, onPress: () => shareToWhatsApp(buildShareMessage(), 'set') },
    { label: t('library:qm.shareMore', 'More ways to share'), icon: ShareUpIcon, onPress: () => { Share.share({ message: buildShareMessage() }).catch(() => {}); } },
  ];
  const cardActions: QMSheetAction[] = target ? [
    { label: t('library:qm.editCard', 'Edit card'), icon: PencilIcon, onPress: () => navigation.navigate('EditCard', { cardId: target.id, setId }) },
    {
      label: t('library:qm.duplicateCard', 'Duplicate card'), icon: CopyIcon,
      onPress: () => copyCard(target.id, { onSuccess: () => Toast.show({ type: 'success', text1: t('library:cards.cardCopied', 'Card copied') }), onError: err }),
    },
    { label: t('library:qm.moveCard', 'Move to another set'), icon: ArrowRightIcon, off: !otherSets.length, sub: otherSets.length ? undefined : t('library:sets.noOtherSets', 'No other sets available'), onPress: () => setSheet('move') },
    {
      label: t('library:qm.askAICard', 'Ask AI about this card'), icon: AskIcon,
      // Via AIConsent so a first-time user can't skip consent.
      onPress: () => navigation.navigate('AITab', { screen: 'AIConsent', params: { autoSend: `Explain this flashcard:\nQ: ${target.question}\nA: ${target.answer}` } }),
    },
    { label: t('library:qm.deleteCard', 'Delete card'), icon: TrashIcon, danger: true, onPress: () => deleteCard(target) },
  ] : [];
  const moveActions: QMSheetAction[] = target ? otherSets.map(s => ({
    label: s.title, icon: CardsIcon, iconColor: s.color ? qmAccent(qm, dark, s.color)[1] : qm.link,
    onPress: () => moveCard({ id: target.id, payload: { targetSetId: s.id } }, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('library:qm.movedTo', { name: s.title }) }),
      onError: err,
    }),
  })) : [];
  const cardSub = target ? (target.question || t('library:qm.storyCard', 'Story card')) : undefined;
  const sheetProps = {
    set: { title: t('library:qm.setOptions', 'Set options'), sub: title, actions: setActions },
    share: { title: t('library:qm.shareTitle', 'Share this set'), sub: title, actions: shareActions },
    card: { title: t('library:qm.cardOptions', 'Card options'), sub: cardSub, actions: cardActions },
    move: { title: t('library:qm.moveWhich', 'Move to which set?'), sub: cardSub, actions: moveActions },
    note: { title: t('library:qm.note', 'Note'), sub: cardSub, actions: undefined },
  } as const;

  // ── Card ────────────────────────────────────────────────────────────────────
  const grid = cardLayout === 'grid';
  const renderCard = useCallback(({ item, index }: { item: CardType; index: number }) => (
    <Animated.View entering={qmRowEnter(index)} style={grid ? styles.gridCell : styles.listCell}>
      <CardTile
        card={item}
        grid={grid}
        owner={isOwner}
        onNote={() => openNote(item)}
        onBlur={() => toggleBlur(item)}
        onMenu={() => openCardMenu(item)}
      />
    </Animated.View>
  ), [grid, isOwner, openNote, toggleBlur, openCardMenu]);

  const renderReorder = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<CardType>) => {
    const n = (getIndex() ?? 0) + 1;
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          disabled={isActive}
          style={[styles.reorderRow, { backgroundColor: qm.surface, boxShadow: isActive ? qm.liftShadow : qm.cardShadow }]}
          accessibilityLabel={t('library:qm.dragCard', { n, defaultValue: `Drag to move card ${n}` })}
        >
          <View style={styles.grip}><GripIcon size={20} color={qm.muted} /></View>
          <View style={styles.flex}>
            <Typography preset="qmChip" color={qm.link}>{item.type === 'STORY' ? t('library:qm.passage', 'Passage') : t('library:qm.question', 'Question')}</Typography>
            <Typography preset="qmCardTitle" color={qm.ink} numberOfLines={1} style={styles.reorderTitle}>{item.question || item.answer}</Typography>
          </View>
          <Typography preset="qmMeta" color={qm.muted}>{n}</Typography>
        </Pressable>
      </ScaleDecorator>
    );
  }, [qm, t]);

  // ── Header / hero ───────────────────────────────────────────────────────────
  const hero = (
    <View style={[styles.hero, { backgroundColor: coverBg, paddingTop: insets.top + HERO_TOP }]}>
      <Typography preset="qmPageTitle" color={qm.ink}>{title}</Typography>
      <Typography preset="qmBody" color={qm.body} style={styles.heroMeta}>{setMeta}</Typography>

      {!isOwner && (
        <>
          {set?.user?.name ? (
            <View style={styles.byRow}>
              <View style={[styles.avatar, { backgroundColor: frost }]}>
                <Typography preset="qmCardTitle" color={coverInk}>{set.user.name.charAt(0).toUpperCase()}</Typography>
              </View>
              <Typography preset="qmButton" color={coverInk}>{t('library:qm.byName', { name: set.user.name, defaultValue: `by ${set.user.name}` })}</Typography>
            </View>
          ) : null}
          {set?.description ? <Typography preset="qmBodyMd" color={qm.body} style={styles.desc}>{set.description}</Typography> : null}
          <AnimatedPressable
            scaleTo={0.97}
            onPress={saveCopy}
            disabled={saved || cloning}
            style={[styles.saveBtn, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: saved, busy: cloning }}
          >
            {cloning ? <ActivityIndicator size="small" color={qm.violet} /> : saved ? <CheckIcon size={18} color={qm.leafText} strokeWidth={2.4} /> : <PlusIcon size={18} color={qm.link} strokeWidth={2} />}
            <Typography preset="qmButtonLg" color={saved ? qm.leafText : qm.link}>
              {saved ? t('library:qm.savedCopyShort', 'Saved to your library') : t('library:qm.saveCopy', 'Save a copy')}
            </Typography>
          </AnimatedPressable>
        </>
      )}

      {isOwner && cards.length > 0 && (
        <>
          {mastery && mastery.total > 0 && (
            <View style={[styles.mastery, { backgroundColor: frost }]}>
              <View style={styles.masteryHead}>
                <View style={styles.masteryLabel}>
                  <Typography preset="qmLink" color={coverInk}>{t('library:cards.mastery', 'Mastery')}</Typography>
                  <Pressable onPress={() => setMasteryInfo(v => !v)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('library:cards.masteryInfoA11y', 'What is mastery?')} accessibilityState={{ expanded: masteryInfo }}>
                    <InfoIcon size={16} color={coverInk} strokeWidth={2} />
                  </Pressable>
                </View>
                <Typography preset="qmLink" color={coverInk}>
                  {t('library:qm.masteryCount', { learned: mastery.learned, total: mastery.total, defaultValue: `${mastery.learned} of ${mastery.total} learned` })}
                </Typography>
              </View>
              <View style={[styles.track, { backgroundColor: mixHex(coverInk, coverBg, 0.18) }]}>
                <View style={[styles.fill, { width: `${mastery.masteryPct}%`, backgroundColor: coverInk }]} />
              </View>
              {masteryInfo && (
                <Typography preset="qmMeta" color={qm.body} style={styles.tip}>
                  {t('library:qm.masteryInfo', 'A card counts as learned once you’ve quizzed it enough that it won’t be due again for 21 days or more. This bar shows how well this set is sticking long-term.')}
                </Typography>
              )}
            </View>
          )}
          <View style={styles.heroBtns}>
            <AnimatedPressable scaleTo={0.97} onPress={() => setQuizOpen(true)} style={[styles.quizBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
              <PlayIcon size={18} color={qm.onViolet} />
              <Typography preset="qmButtonLg" color={qm.onViolet}>{t('library:qm.startQuiz', 'Start a quiz')}</Typography>
            </AnimatedPressable>
            <AnimatedPressable scaleTo={0.94} onPress={addCard} style={[styles.addBtn, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]} accessibilityRole="button" accessibilityLabel={t('library:qm.addCard', 'Add a card')}>
              <PlusIcon size={22} color={qm.ink} />
            </AnimatedPressable>
          </View>
        </>
      )}
    </View>
  );

  const head = cards.length > 0 && (
    <View style={styles.head}>
      <Typography preset="qmSection" color={qm.ink} style={styles.headLabel}>
        {q ? t('library:qm.matchCount', { count: shownCards.length, defaultValue: `${shownCards.length} matches` }) : t('library:cards.cardCount', { count: cards.length })}
      </Typography>
      <View style={[styles.seg, { backgroundColor: qm.field }]} accessibilityRole="tablist" accessibilityLabel={t('library:qm.layoutA11y', 'Card layout')}>
        {(['list', 'grid'] as const).map(l => (
          <Pressable
            key={l}
            onPress={() => setCardLayout(l)}
            style={[styles.segBtn, l === cardLayout && { backgroundColor: qm.pill, boxShadow: qm.pillShadow }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: l === cardLayout }}
            accessibilityLabel={l === 'list' ? t('library:cards.listView', 'List view') : t('library:cards.gridView', 'Grid view')}
          >
            {l === 'list' ? <ListIcon size={18} color={qm.ink} strokeWidth={2} /> : <GridIcon size={18} color={qm.ink} strokeWidth={2} />}
          </Pressable>
        ))}
      </View>
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={RefreshIcon}
        title={t('library:qm.cardsFailedTitle', 'The cards did not load')}
        text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
        action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: onRefresh }} />
    );
  } else if (!cards.length) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={CardsIcon}
        title={t('library:qm.noCardsYet', 'No cards yet')}
        text={isOwner ? t('library:qm.noCardsText', 'Add a question or a verse, and this set is ready to quiz.') : t('library:cards.noCardsInSet', 'This set has no cards yet')}
        action={isOwner ? { label: t('library:qm.addCards', 'Add cards'), onPress: addCard } : undefined} />
    );
  } else if (!shownCards.length) {
    empty = (
      <QMEmpty style={styles.emptyGap} icon={SearchIcon}
        title={t('library:qm.noCardsMatch', 'No cards match')}
        text={t('library:qm.noCardsMatchText', { query: search.trim(), defaultValue: `Nothing with “${search.trim()}”. Try another word, or check the spelling.` })} />
    );
  }

  const topPad = insets.top + BAR_H;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      {reorderMode ? (
        <DraggableFlatList
          data={orderedCards}
          onDragEnd={({ data }) => setOrderedCards(data)}
          keyExtractor={item => item.id}
          renderItem={renderReorder}
          ListHeaderComponent={
            <Typography preset="qmBody" color={qm.muted} style={[styles.reorderHint, { paddingTop: topPad + spacing.md }]}>
              {t('library:qm.reorderHint', 'Press and hold a card, then drag it. Quizzes follow this order.')}
            </Typography>
          }
          contentContainerStyle={styles.reorderList}
          containerStyle={styles.flex}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.FlatList
          key={cardLayout}
          data={isLoading || isError ? [] : shownCards}
          keyExtractor={item => item.id}
          numColumns={grid ? 2 : 1}
          columnWrapperStyle={grid ? styles.gridRow : undefined}
          renderItem={renderCard}
          ListHeaderComponent={<>{searching ? <View style={{ height: topPad + spacing.md }} /> : hero}{head}</>}
          ListEmptyComponent={empty}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={topPad} />}
        />
      )}

      {/* Top bar: transparent over the cover, solid once scrolled (always solid while searching/reordering). */}
      <View style={[styles.bar, { paddingTop: insets.top, height: topPad }]}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: qm.glass, borderBottomColor: qm.hair }, styles.barBg, searching || reorderMode ? null : barBgStyle]}
        />
        {reorderMode ? (
          <>
            <Pressable onPress={() => { setReorderMode(false); setOrderedCards([]); }} hitSlop={6} style={styles.textBtn} accessibilityRole="button">
              <Typography preset="qmBodyLg" color={qm.link} style={styles.regular}>{t('common:actions.cancel', 'Cancel')}</Typography>
            </Pressable>
            <Typography preset="qmBarTitle" color={qm.ink} align="center" style={styles.flex}>{t('library:qm.reorderCards', 'Reorder cards')}</Typography>
            <Pressable onPress={saveReorder} disabled={isReordering} hitSlop={6} style={[styles.textBtn, styles.textBtnRight]} accessibilityRole="button">
              {isReordering ? <ActivityIndicator size="small" color={qm.violet} /> : <Typography preset="qmBodyLg" color={qm.link}>{t('common:actions.save', 'Save')}</Typography>}
            </Pressable>
          </>
        ) : searching ? (
          <>
            <View style={[styles.searchBox, { backgroundColor: qm.field }]}>
              <SearchIcon size={18} color={qm.muted} strokeWidth={2} />
              <TextInput
                autoFocus
                value={search}
                onChangeText={setSearch}
                placeholder={t('library:qm.searchCards', 'Search cards in this set')}
                placeholderTextColor={qm.muted}
                returnKeyType="search"
                style={[styles.searchInput, { color: qm.ink }]}
                accessibilityLabel={t('library:qm.searchCards', 'Search cards in this set')}
              />
            </View>
            <Pressable onPress={() => { setSearching(false); setSearch(''); }} hitSlop={6} style={styles.textBtn} accessibilityRole="button">
              <Typography preset="qmBodyLg" color={qm.link} style={styles.regular}>{t('common:actions.cancel', 'Cancel')}</Typography>
            </Pressable>
          </>
        ) : (
          <>
            <BarButton onPress={navigation.goBack} label={t('common:actions.back', 'Back')}><ChevronLeftIcon size={20} color={qm.ink} /></BarButton>
            <Animated.View style={[styles.flex, barBgStyle]}>
              <Typography preset="qmBarTitle" color={qm.ink} numberOfLines={1}>{title}</Typography>
            </Animated.View>
            {cards.length > 0 && (
              <>
                <BarButton onPress={() => setSearching(true)} label={t('library:qm.searchCardsA11y', 'Search cards')}><SearchIcon size={20} color={qm.ink} /></BarButton>
                <BarButton onPress={() => setSheet('share')} label={t('library:qm.shareA11y', 'Share set')}><ShareUpIcon size={20} color={qm.ink} /></BarButton>
              </>
            )}
            {isOwner && <BarButton onPress={() => setSheet('set')} label={t('library:qm.setOptions', 'Set options')}><MoreVerticalIcon size={20} color={qm.ink} /></BarButton>}
          </>
        )}
      </View>

      {(['set', 'share', 'card', 'move'] as const).map(k => (
        <QMSheet key={k} visible={sheet === k} onClose={() => setSheet(s => (s === k ? null : s))} {...sheetProps[k]} />
      ))}

      <QMSheet visible={sheet === 'note'} onClose={() => setSheet(s => (s === 'note' ? null : s))} title={sheetProps.note.title} sub={cardSub}>
        <View style={styles.noteForm}>
          <View style={styles.labelRow}>
            <Typography preset="qmFieldLabel" color={qm.ink}>{t('library:qm.yourNote', 'Your note')}</Typography>
            <Typography preset="qmBody" color={qm.muted}>{noteText.length} / {NOTE_MAX}</Typography>
          </View>
          <BottomSheetTextInput
            value={noteText}
            onChangeText={setNoteText}
            multiline
            maxLength={NOTE_MAX}
            placeholder={t('library:qm.notePlaceholder', 'What does this verse say to you?')}
            placeholderTextColor={qm.muted}
            autoCapitalize="sentences"
            accessibilityLabel={t('library:qm.yourNote', 'Your note')}
            style={[styles.noteInput, { backgroundColor: qm.bg, borderColor: qm.line, color: qm.ink }]}
          />
          <Typography preset="qmMeta" color={qm.muted} style={styles.noteHint}>{t('library:qm.notePrivate', 'Only you can see your notes.')}</Typography>
          <AnimatedPressable scaleTo={0.97} onPress={saveNote} disabled={savingNote} style={[styles.noteBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
            {savingNote ? <ActivityIndicator size="small" color={qm.onViolet} /> : <Typography preset="qmButtonLg" color={qm.onViolet}>{t('library:qm.saveNote', 'Save note')}</Typography>}
          </AnimatedPressable>
        </View>
      </QMSheet>

      <QuizModeSheet
        visible={quizOpen}
        setIds={[setId]}
        setTitles={[title]}
        onClose={() => setQuizOpen(false)}
        onStart={(mode, ids, titles) => navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode })}
      />

      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function BarButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.barBtn, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={label}>
      {children}
    </Pressable>
  );
}

/** One card: front (question / reference) over a dashed rule, back (answer / passage) below. */
const CardTile = React.memo(function CardTile({ card, grid, owner, onNote, onBlur, onMenu }: {
  card: CardType; grid: boolean; owner: boolean; onNote: () => void; onBlur: () => void; onMenu: () => void;
}) {
  const { t } = useTranslation('library');
  const { qm } = useTheme();
  const story = card.type === 'STORY';
  const hasFront = !story || !!card.question;
  const hidden = card.isBlurred && owner;
  const answer = hidden
    ? <Typography preset="qmMeta" color={qm.muted} style={styles.reveal}>{t('qm.tapEye', 'Tap the eye to reveal')}</Typography>
    : null;
  return (
    <View style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <View style={grid ? styles.frontGrid : styles.front}>
        <View style={styles.cardHead}>
          <Typography preset="qmChip" color={hasFront ? qm.link : qm.muted} numberOfLines={1} style={styles.flex}>
            {story ? (hasFront ? t('qm.reference', 'Reference') : t('qm.passage', 'Passage')) : t('qm.question', 'Question')}
          </Typography>
          {owner && (
            <View style={styles.cardIcons}>
              <IconBtn onPress={onNote} label={card.note ? t('qm.editNote', 'Edit note') : t('qm.addNote', 'Add a note')}>
                <DocIcon size={16} color={card.note ? qm.link : qm.muted} strokeWidth={2} />
              </IconBtn>
              <IconBtn onPress={onBlur} label={card.isBlurred ? t('qm.showAnswer', 'Show answer') : t('qm.hideAnswer', 'Hide answer')}>
                {card.isBlurred ? <EyeOffIcon size={17} color={qm.muted} strokeWidth={2} /> : <EyeIcon size={17} color={qm.muted} strokeWidth={2} />}
              </IconBtn>
              <IconBtn onPress={onMenu} label={t('qm.cardOptions', 'Card options')}>
                <MoreVerticalIcon size={17} color={qm.muted} />
              </IconBtn>
            </View>
          )}
        </View>
        {hasFront ? (
          <Typography preset="qmCardTitle" color={qm.ink} style={grid ? styles.qGrid : styles.q} numberOfLines={grid ? 3 : undefined}>{card.question}</Typography>
        ) : hidden ? answer : (
          <Typography preset="qmCardTitle" color={qm.body} style={grid ? styles.qGrid : styles.storyText} numberOfLines={grid ? 4 : undefined}>{card.answer}</Typography>
        )}
      </View>
      {hasFront && (
        <View style={grid ? styles.backGrid : styles.back}>
          <View style={styles.dashClip}><View style={[styles.dash, { borderColor: qm.line }]} /></View>
          <Typography preset="qmChip" color={qm.muted}>{story ? t('qm.passage', 'Passage') : t('qm.answer', 'Answer')}</Typography>
          {hidden ? answer : (
            <Typography preset={grid ? 'qmMeta' : 'qmBodyMd'} color={qm.body} style={styles.a} numberOfLines={grid ? 3 : undefined}>{card.answer}</Typography>
          )}
        </View>
      )}
    </View>
  );
});

function IconBtn({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.iconBtn, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={label}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  regular: { fontFamily: textPresets.qmBody.fontFamily },
  content: { paddingBottom: spacing.xxxl },
  hero: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.s22,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
  },
  heroMeta: { marginTop: spacing.s6 },
  byRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, marginTop: spacing.s14 },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, alignItems: 'center', justifyContent: 'center' },
  desc: { marginTop: spacing.md },
  saveBtn: {
    marginTop: spacing.lg, height: BTN_H, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  mastery: { marginTop: spacing.s18, padding: spacing.s14, borderRadius: radius.r18 },
  masteryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  masteryLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6 },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: '100%', borderRadius: TRACK_H / 2 },
  tip: { marginTop: spacing.s10 },
  heroBtns: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.lg },
  quizBtn: { flex: 1, height: BTN_H, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  addBtn: { width: BTN_H, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.s22, paddingBottom: spacing.md },
  headLabel: { fontSize: 16 },
  seg: { flexDirection: 'row', padding: spacing.s3, borderRadius: radius.r12 },
  segBtn: { width: SEG_W, height: SEG_H, borderRadius: radius.r10 - 1, alignItems: 'center', justifyContent: 'center' },
  listCell: { paddingHorizontal: spacing.xl, marginBottom: spacing.s10 },
  gridRow: { paddingHorizontal: spacing.xl, gap: spacing.s10, alignItems: 'flex-start' },
  gridCell: { flex: 1, maxWidth: '50%', marginBottom: spacing.s10 },
  card: { borderRadius: radius.r20, overflow: 'hidden' },
  front: { paddingTop: spacing.s10, paddingLeft: spacing.lg, paddingRight: spacing.s6, paddingBottom: spacing.md },
  frontGrid: { paddingTop: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.xs, paddingBottom: spacing.s10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', minHeight: ICON_BTN, gap: spacing.xs },
  cardIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: ICON_BTN, height: ICON_BTN, borderRadius: ICON_BTN / 2, alignItems: 'center', justifyContent: 'center' },
  q: { fontSize: 17, lineHeight: 24, marginTop: spacing.xs, paddingRight: spacing.s10 },
  qGrid: { fontSize: 15, lineHeight: 21, marginTop: spacing.xs, paddingRight: spacing.sm },
  storyText: { fontSize: 17, lineHeight: 26, marginTop: spacing.xs, paddingRight: spacing.s10, fontFamily: textPresets.qmVerse.fontFamily },
  back: { paddingTop: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.s14 },
  backGrid: { paddingTop: spacing.s10, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  // RN can't dash a single border edge: clip a dashed box to its top line.
  dashClip: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, overflow: 'hidden' },
  dash: { height: 2, borderWidth: 1, borderStyle: 'dashed' },
  a: { marginTop: spacing.xs },
  reveal: { marginTop: spacing.s6 },
  loading: { marginTop: spacing.huge },
  emptyGap: { marginTop: spacing.xxxl, marginHorizontal: spacing.xxxl },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.s10 },
  barBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  barBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  textBtn: { minWidth: 72, height: TOUCH, justifyContent: 'center', paddingHorizontal: spacing.sm },
  textBtnRight: { alignItems: 'flex-end' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
    height: TOUCH, paddingHorizontal: spacing.s14, marginLeft: spacing.s6, borderRadius: radius.r12 + 2,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, ...textPresets.qmInput, fontSize: 15 },
  reorderHint: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  reorderList: { paddingBottom: spacing.xxxl },
  reorderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60,
    marginHorizontal: spacing.xl, marginBottom: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.s6, paddingRight: spacing.s14,
    borderRadius: radius.r18,
  },
  grip: { width: 40, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  reorderTitle: { marginTop: spacing.s2 },
  noteForm: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.s6 },
  noteInput: {
    minHeight: NOTE_MIN_H, paddingHorizontal: spacing.s14, paddingVertical: spacing.md, borderRadius: radius.r12 + 2, borderWidth: 1,
    textAlignVertical: 'top', ...textPresets.qmInput, lineHeight: 24,
  },
  noteHint: { marginTop: spacing.sm, marginHorizontal: spacing.s2 },
  noteBtn: { marginTop: spacing.s18, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
