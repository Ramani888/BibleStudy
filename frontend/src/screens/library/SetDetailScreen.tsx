import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Share, StyleSheet, TextInput, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';

import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState, SelectSheet } from '../../components/feedback';
import { QuizModeSheet } from '../../components/domain';
import { Button, Divider, Input, Screen, ScreenHeader, SearchBar, Typography } from '../../components/ui';
import {
  SearchIcon, ShareIcon, MoreVerticalIcon, InfoIcon, EyeIcon, EyeOffIcon,
  BookIcon, CheckCircleIcon, PlusCircleIcon, PencilIcon, CopyIcon, ArrowRightIcon, SparklesIcon, TrashIcon, ReorderIcon,
  ListIcon, GridIcon,
} from '../../components/icons';

import { useTranslation } from 'react-i18next';
import { useCards, useConfirmDialog, useCopyCard, useDeleteCard, useManualRefresh, useMoveCard, useReorderCards, useSearchToggle, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { CARD_FILL_LIGHT, fontSizes, fontWeights, layout, lineHeights, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

const ICON_SIZE = 20;

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
  const { t } = useTranslation(['library', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';

  const { setId, setTitle, isOwner = true } = route.params;
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [moveTargetCard, setMoveTargetCard] = useState<CardType | null>(null);
  const [noteCard, setNoteCard] = useState<CardType | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('list');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const { query: cardSearch, setQuery: setCardSearch, visible: cardSearchVisible, toggle: toggleCardSearch } = useSearchToggle();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedCards, setOrderedCards] = useState<CardType[]>([]);

  const { data: cards = [], isLoading, isError, refetch } = useCards(setId);
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const { data: allSets = [] } = useSets();
  const { mutateAsync: deleteCardAsync } = useDeleteCard(setId);
  const { show, dialogProps } = useConfirmDialog();
  const { mutate: copyCard }   = useCopyCard(setId);
  const { mutate: moveCard }   = useMoveCard(setId);
  const { mutate: updateCard, mutateAsync: updateCardAsync } = useUpdateCard(setId);
  const { mutate: reorderCards, isPending: isReordering } = useReorderCards();

  const cachedTitle = allSets.find(s => s.id === setId)?.title;

  const moveSetOptions = useMemo(
    () => allSets.map(s => ({ id: s.id, label: s.title })),
    [allSets],
  );
  useEffect(() => {
    if (cachedTitle) navigation.setOptions({ title: cachedTitle });
  }, [cachedTitle, navigation]);

  const handleShare = useCallback(async () => {
    try {
      const title = cachedTitle ?? setTitle;
      const cardList = cards
        .map((c, i) => `${i + 1}. ${c.question}\n   ${c.answer}`)
        .join('\n\n');
      const divider = '─'.repeat(Math.min(title.length, 40));
      await Share.share({ message: `${title}\n${divider}\n\n${cardList}` });
    } catch {}
  }, [cachedTitle, setTitle, cards]);

  const filteredCards = useMemo(
    () => cardSearch.trim()
      ? cards.filter(
          c =>
            c.question.toLowerCase().includes(cardSearch.trim().toLowerCase()) ||
            c.answer.toLowerCase().includes(cardSearch.trim().toLowerCase()),
        )
      : cards,
    [cards, cardSearch],
  );

  const handleCopyCard = useCallback((id: string) => {
    copyCard(id, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('library:cards.cardCopied', 'Card copied') }),
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [copyCard, t]);

  const handleBlurToggle = useCallback((card: CardType) => {
    updateCard({ id: card.id, payload: { isBlurred: !card.isBlurred } }, {
      onSuccess: () =>
        Toast.show({ type: 'success', text1: card.isBlurred ? t('library:cards.cardUnblurred', 'Card unblurred') : t('library:cards.cardBlurred', 'Card blurred') }),
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [updateCard, t]);

  const allBlurred = cards.length > 0 && cards.every(c => c.isBlurred);

  const handleBlurAll = useCallback(async (blur: boolean) => {
    const toUpdate = cards.filter(c => c.isBlurred !== blur);
    if (toUpdate.length === 0) return;
    const results = await Promise.allSettled(
      toUpdate.map(c => updateCardAsync({ id: c.id, payload: { isBlurred: blur } })),
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed === 0) {
      Toast.show({ type: 'success', text1: blur ? t('library:cards.allCardsBlurred', 'All cards blurred') : t('library:cards.allCardsUnblurred', 'All cards unblurred') });
    } else {
      Toast.show({ type: 'error', text1: t('library:cards.batchUpdateResult', { updated: toUpdate.length - failed, failed, defaultValue: `${toUpdate.length - failed} updated, ${failed} failed` }) });
    }
  }, [cards, updateCardAsync, t]);

  const handleMoveCard = useCallback((targetSetId: string) => {
    if (!moveTargetCard) return;
    moveCard({ id: moveTargetCard.id, payload: { targetSetId } }, {
      onSuccess: () => {
        setMovePickerOpen(false);
        setMoveTargetCard(null);
        Toast.show({ type: 'success', text1: t('library:cards.cardMoved', 'Card moved') });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [moveTargetCard, moveCard, t]);

  const handleEnterReorder = useCallback(() => {
    setOrderedCards([...cards]);
    setReorderMode(true);
  }, [cards]);

  const handleSaveReorder = useCallback(() => {
    reorderCards({ setId, cardIds: orderedCards.map(c => c.id) }, {
      onSuccess: () => {
        setReorderMode(false);
        setOrderedCards([]);
        Toast.show({ type: 'success', text1: t('library:cards.orderSaved', 'Order saved') });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [reorderCards, setId, orderedCards, t]);

  const handleCancelReorder = useCallback(() => {
    setReorderMode(false);
    setOrderedCards([]);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!noteCard) return;
    setSavingNote(true);
    updateCard({ id: noteCard.id, payload: { note: noteText.trim() || null } }, {
      onSuccess: () => {
        setSavingNote(false);
        setNoteCard(null);
        Toast.show({ type: 'success', text1: t('library:cards.noteSaved', 'Note saved') });
      },
      onError: (err: unknown) => {
        setSavingNote(false);
        Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
      },
    });
  }, [noteCard, noteText, updateCard, t]);

  const handleDelete = useCallback((cardId: string) => {
    show({
      title: t('library:cards.deleteCardTitle', 'Delete card?'),
      message: t('library:cards.deleteCardMessage', 'This cannot be undone.'),
      confirmLabel: t('common:actions.delete', 'Delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCardAsync(cardId);
          Toast.show({ type: 'success', text1: t('library:cards.cardDeleted', 'Card deleted') });
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteCardAsync, t]);

  const handleGoBack         = useCallback(() => navigation.goBack(), [navigation]);
  const handleOpenHeaderMenu = useCallback(() => setHeaderMenuOpen(true), []);
  const handleCloseHeaderMenu = useCallback(() => setHeaderMenuOpen(false), []);
  const handleCloseSelectedCard = useCallback(() => setSelectedCard(null), []);
  const handleCloseMovePicker   = useCallback(() => { setMovePickerOpen(false); setMoveTargetCard(null); }, []);
  const handleCloseQuizSheet    = useCallback(() => setQuizSheetOpen(false), []);
  const handleCloseNoteModal    = useCallback(() => { setNoteCard(null); setNoteText(''); }, []);
  const handleDragEnd = useCallback(({ data }: { data: CardType[] }) => setOrderedCards(data), []);
  const handleQuizStart = useCallback((mode: any, ids: string[], titles: string[]) =>
    navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode }), [navigation]);

  // ── Header (normal vs reorder) ──
  const header = reorderMode ? (
    <View style={[styles.reorderBar, { borderBottomColor: colors.border }]}>
      <Pressable onPress={handleCancelReorder} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
        <Typography preset="bodySm" color={colors.textSecondary}>{t('common:actions.cancel')}</Typography>
      </Pressable>
      <Typography preset="bodySm" style={styles.reorderTitle}>{t('library:cards.reorderCards', 'Reorder Cards')}</Typography>
      <Pressable onPress={handleSaveReorder} disabled={isReordering} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
        {isReordering
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Typography preset="bodySm" color={colors.accent} style={styles.reorderTitle}>{t('common:actions.save')}</Typography>
        }
      </Pressable>
    </View>
  ) : (
    <View>
      <ScreenHeader
        title={cachedTitle ?? setTitle}
        onBack={handleGoBack}
        right={
          <>
            <Pressable onPress={toggleCardSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <SearchIcon size={ICON_SIZE} color={cardSearchVisible ? colors.accent : colors.textSecondary} />
            </Pressable>
            {cards.length > 0 && (
              <Pressable onPress={handleShare} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
                <ShareIcon size={ICON_SIZE} color={colors.textSecondary} />
              </Pressable>
            )}
            <Pressable onPress={handleOpenHeaderMenu} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <MoreVerticalIcon size={ICON_SIZE} color={colors.textSecondary} />
            </Pressable>
          </>
        }
      />
      <Typography preset="bodySm" color={colors.textSecondary} style={styles.count}>
        {t('library:cards.cardCount', { count: cardSearch ? filteredCards.length : cards.length, defaultValue: `${cardSearch ? filteredCards.length : cards.length} cards` })}
      </Typography>
      {cardSearchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder={t('library:cards.searchPlaceholder', 'Search cards…')}
            value={cardSearch}
            onChangeText={setCardSearch}
            containerStyle={styles.searchInput}
            autoFocus
          />
        </View>
      )}
    </View>
  );

  if (isError) {
    return (
      <Screen header={header}>
        <ErrorState message={t('library:cards.couldNotLoadCards', 'Could not load cards.')} onRetry={refetch} />
      </Screen>
    );
  }

  // ── Normal card (list / grid) ──
  const renderCard = useCallback(({ item }: { item: CardType }) => {
    const isStory = item.type === 'STORY';
    return (
    <View style={[
      styles.cardItem,
      { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border },
      !isDark && styles.cardShadow,
      cardLayout === 'grid' && styles.cardItemGrid,
    ]}>
      {/* Question / Reference — label + icons on top row, text below */}
      {(!isStory || item.question) ? (
      <View style={[styles.questionSection, { borderBottomColor: colors.border }, cardLayout === 'grid' && styles.questionSectionGrid]}>
        <View style={styles.questionHeader}>
          <Typography preset="caption" color={colors.textDisabled}>{isStory ? t('library:cards.reference', 'Reference') : t('library:cards.question', 'Question')}</Typography>
          {isOwner ? (
            <View style={styles.cardActions}>
              <Pressable onPress={() => { setNoteCard(item); setNoteText(item.note ?? ''); }} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
                <InfoIcon size={ICON_SIZE} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleBlurToggle(item)} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
                {item.isBlurred ? <EyeOffIcon size={ICON_SIZE} color={colors.textSecondary} /> : <EyeIcon size={ICON_SIZE} color={colors.textSecondary} />}
              </Pressable>
              <Pressable onPress={() => setSelectedCard(item)} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
                <MoreVerticalIcon size={ICON_SIZE} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}
        </View>
        <Typography preset="body" style={styles.question} numberOfLines={cardLayout === 'grid' ? 3 : undefined}>
          {item.question}
        </Typography>
      </View>
      ) : null}

      {/* Answer / Passage — distinct bg so it reads as "back of the card" */}
      <View style={[
        styles.answerSection,
        { backgroundColor: isDark ? colors.surface : colors.background },
        cardLayout === 'grid' && styles.answerSectionGrid,
      ]}>
        {item.isBlurred && isOwner ? (
          <View style={styles.blurOverlay}>
            <Typography preset="bodySm" color={colors.textDisabled}>{t('library:cards.tapToReveal', 'Tap eye icon to reveal answer')}</Typography>
          </View>
        ) : (
          <>
            <Typography preset="caption" color={colors.textDisabled}>{isStory ? t('library:cards.passage', 'Passage') : t('library:cards.answer', 'Answer')}</Typography>
            <Typography preset="body" color={colors.textSecondary} style={styles.answer} numberOfLines={cardLayout === 'grid' ? 2 : undefined}>
              {item.answer}
            </Typography>
            {item.note && cardLayout === 'list' ? (
              <>
                <Divider marginV={spacing.sm} />
                <Typography preset="caption" color={colors.textSecondary}>{t('library:cards.note', 'Note')}</Typography>
                <Typography preset="bodySm" color={colors.textSecondary} style={styles.note}>
                  {item.note}
                </Typography>
              </>
            ) : null}
          </>
        )}
      </View>
    </View>
    );
  }, [isDark, colors, cardLayout, isOwner, handleBlurToggle, t]);

  // ── Reorder card (drag handle) ──
  const renderReorderCard = useCallback(({ item, drag, isActive }: RenderItemParams<CardType>) => {
    const isStory = item.type === 'STORY';
    return (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
        style={({ pressed }) => [
          styles.cardItem,
          { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border },
          isActive && styles.cardItemActive,
          pressed && !isActive && styles.cardPressed,
        ]}
      >
        <View style={[styles.questionSection, { borderBottomColor: colors.border }]}>
          <View style={styles.questionHeader}>
            <Typography preset="caption" color={colors.textDisabled}>{isStory ? t('library:cards.reference', 'Reference') : t('library:cards.question', 'Question')}</Typography>
            <View style={styles.cardActions}>
              <ReorderIcon size={ICON_SIZE} color={colors.textSecondary} />
            </View>
          </View>
          <Typography preset="body" style={styles.question} numberOfLines={2}>
            {item.question}
          </Typography>
        </View>
        <View style={[styles.answerSection, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Typography preset="caption" color={colors.textDisabled}>{isStory ? t('library:cards.passage', 'Passage') : t('library:cards.answer', 'Answer')}</Typography>
          <Typography preset="body" color={colors.textSecondary} style={styles.answer} numberOfLines={2}>
            {item.answer}
          </Typography>
        </View>
      </Pressable>
    </ScaleDecorator>
    );
  }, [isDark, colors, t]);

  return (
    <Screen header={header}>
      {reorderMode ? (
        <View style={styles.flex}>
        <DraggableFlatList
          data={orderedCards}
          onDragEnd={handleDragEnd}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={renderReorderCard}
        />
        </View>
      ) : (
        <View style={styles.flex}>
        <FlatList
          key={cardLayout}
          data={filteredCards}
          keyExtractor={item => item.id}
          numColumns={cardLayout === 'grid' ? 2 : 1}
          columnWrapperStyle={cardLayout === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color={colors.accent} style={styles.listLoader} />
            ) : (
              <EmptyState
                title={cardSearch ? t('library:cards.noResults', 'No results') : t('library:cards.noCardsYet', 'No cards yet')}
                subtitle={cardSearch ? t('library:cards.noMatch', { query: cardSearch, defaultValue: `No cards match "${cardSearch}"` }) : isOwner ? t('library:cards.addCardsToStudy', 'Add cards to start studying this set') : t('library:cards.noCardsInSet', 'This set has no cards yet')}
                ctaLabel={cardSearch || !isOwner ? undefined : t('library:cards.addCards', 'Add Cards')}
                onCta={cardSearch || !isOwner ? undefined : () => navigation.navigate('CreateCard', { setId })}
              />
            )
          }
          renderItem={renderCard}
        />
        </View>
      )}

      {/* ── Card action sheet ── */}
      <ActionSheet
        visible={!!selectedCard}
        title={t('library:cards.cardOptions', 'Card options')}
        onClose={handleCloseSelectedCard}
        actions={[
          { label: t('common:actions.edit', 'Edit'), icon: PencilIcon, onPress: () => selectedCard && navigation.navigate('EditCard', { cardId: selectedCard.id, setId }) },
          { label: t('common:actions.copy', 'Copy'), icon: CopyIcon, onPress: () => selectedCard && handleCopyCard(selectedCard.id) },
          { label: t('library:cards.moveToSet', 'Move to Set'), icon: ArrowRightIcon, onPress: () => { setMoveTargetCard(selectedCard); setMovePickerOpen(true); } },
          {
            label: t('library:cards.askAI', 'Ask AI'), icon: SparklesIcon, onPress: () => {
              if (!selectedCard) return;
              const prompt = `Explain this flashcard:\nQ: ${selectedCard.question}\nA: ${selectedCard.answer}`;
              navigation.navigate('AITab', { screen: 'AIChat', params: { autoSend: prompt } });
            },
          },
          { label: t('common:actions.delete', 'Delete'), icon: TrashIcon, destructive: true, onPress: () => selectedCard && handleDelete(selectedCard.id) },
        ]}
      />

      {/* ── Move to set picker ── */}
      <SelectSheet
        visible={movePickerOpen}
        title={t('library:cards.moveToSet', 'Move to Set')}
        searchPlaceholder={t('library:sets.searchPlaceholder', 'Search sets…')}
        options={moveSetOptions}
        optionIcon={BookIcon}
        selectedId={setId}
        onSelect={handleMoveCard}
        onClose={handleCloseMovePicker}
        emptyText={t('library:sets.noOtherSets', 'No other sets available')}
      />

      {/* ── Header menu ── */}
      <ActionSheet
        visible={headerMenuOpen}
        title={cachedTitle ?? setTitle}
        onClose={handleCloseHeaderMenu}
        actions={[
          { label: t('navigation:tabs.study', 'Quiz'), icon: CheckCircleIcon, onPress: () => { setHeaderMenuOpen(false); setTimeout(() => setQuizSheetOpen(true), 350); } },
          ...(isOwner ? [
            { label: t('library:cards.createCard', 'Create Card'), icon: PlusCircleIcon, onPress: () => navigation.navigate('CreateCard', { setId }) },
            { label: t('library:sets.editSet', 'Edit Set'), icon: PencilIcon, onPress: () => navigation.navigate('EditSet', { setId }) },
            { label: allBlurred ? t('library:cards.unblurAll', 'Unblur All') : t('library:cards.blurAll', 'Blur All'), icon: allBlurred ? EyeIcon : EyeOffIcon, onPress: () => handleBlurAll(!allBlurred) },
            ...(!isLoading && cards.length > 1 ? [{ label: t('library:cards.reorderCards', 'Reorder Cards'), icon: ReorderIcon, onPress: handleEnterReorder }] : []),
          ] : []),
          { label: cardLayout === 'grid' ? t('library:cards.listView', 'List View') : t('library:cards.gridView', 'Grid View'), icon: cardLayout === 'grid' ? ListIcon : GridIcon, onPress: () => setCardLayout(l => l === 'list' ? 'grid' : 'list') },
        ]}
      />

      <QuizModeSheet
        visible={quizSheetOpen}
        setIds={[setId]}
        setTitles={[cachedTitle ?? setTitle]}
        onClose={handleCloseQuizSheet}
        onStart={handleQuizStart}
      />

      {/* ── Note popup ── */}
      <AppModal
        visible={!!noteCard}
        title={t('library:cards.note', 'Note')}
        onClose={handleCloseNoteModal}
      >
        <TextInput
          style={[styles.notePopupInput, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
          placeholder={t('library:cards.addNotePlaceholder', 'Add a note…')}
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
          maxLength={500}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="sentences"
        />
        <Divider />
        <Button label={t('library:cards.saveNote', 'Save Note')} onPress={handleSaveNote} loading={savingNote} fullWidth />
      </AppModal>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  reorderBar: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  reorderTitle: { fontWeight: fontWeights.semiBold },
  count: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.sm },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md },
  searchInput: { marginBottom: 0 },
  list: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.xxxl,
  },
  listLoader: { marginTop: spacing.xxxl },
  separator: { height: spacing.md },
  flex: { flex: 1 },
  cardItem: {
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardItemActive: { opacity: 0.9 },
  cardPressed: { opacity: 0.7 },
  iconPressed: { opacity: 0.85 },
  questionSection: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: { fontWeight: fontWeights.medium, lineHeight: fontSizes.md * lineHeights.normal },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  answerSection: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  answer: { lineHeight: fontSizes.md * lineHeights.normal },
  note: { lineHeight: 20 }, // ponytail: off-grid Figma value
  blurOverlay: { alignItems: 'center', paddingVertical: spacing.sm },
  // space-between + fixed half-width so an odd last card stays half-width
  // (left column) instead of stretching to fill the row. flex-start keeps each
  // card at its own content height (default 'stretch' would over-tall the
  // shorter card, leaving its answer background cut off at the bottom).
  gridRow: { justifyContent: 'space-between', alignItems: 'flex-start' },
  cardItemGrid: { width: '48.5%' },
  questionSectionGrid: { padding: spacing.md },
  answerSectionGrid: { padding: spacing.md },
  notePopupInput: {
    borderWidth: 1.5,
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 80, // ponytail: off-grid Figma value
    textAlignVertical: 'top',
  },
});
