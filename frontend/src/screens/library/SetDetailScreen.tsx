import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Share, StyleSheet, TextInput, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';

import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState, SelectSheet } from '../../components/feedback';
import { QuizModeSheet } from '../../components/domain';
import { Button, Divider, Input, Screen, ScreenHeader, SearchBar, Typography } from '../../components/ui';
import {
  SearchIcon, ShareIcon, MoreVerticalIcon, InfoIcon, EyeIcon, EyeOffIcon,
  HelpCircleIcon, PlusCircleIcon, PencilIcon, CopyIcon, ArrowRightIcon, SparklesIcon, TrashIcon, ReorderIcon,
  ListIcon, GridIcon,
} from '../../components/icons';

import { useCards, useConfirmDialog, useCopyCard, useDeleteCard, useManualRefresh, useMoveCard, useReorderCards, useSearchToggle, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { CARD_FILL_LIGHT, fontSizes, fontWeights, layout, lineHeights, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

const ICON_SIZE = 20;

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
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
  useEffect(() => {
    if (cachedTitle) navigation.setOptions({ title: cachedTitle });
  }, [cachedTitle, navigation]);

  const handleShare = async () => {
    try {
      const title = cachedTitle ?? setTitle;
      const cardList = cards
        .map((c, i) => `${i + 1}. ${c.question}\n   ${c.answer}`)
        .join('\n\n');
      const divider = '─'.repeat(Math.min(title.length, 40));
      await Share.share({ message: `${title}\n${divider}\n\n${cardList}` });
    } catch {}
  };

  const filteredCards = cardSearch.trim()
    ? cards.filter(
        c =>
          c.question.toLowerCase().includes(cardSearch.trim().toLowerCase()) ||
          c.answer.toLowerCase().includes(cardSearch.trim().toLowerCase()),
      )
    : cards;

  const handleCopyCard = (id: string) => {
    copyCard(id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Card copied' }),
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Copy failed', text2: getErrorMessage(err) }),
    });
  };

  const handleBlurToggle = (card: CardType) => {
    updateCard({ id: card.id, payload: { isBlurred: !card.isBlurred } }, {
      onSuccess: () =>
        Toast.show({ type: 'success', text1: card.isBlurred ? 'Card unblurred' : 'Card blurred' }),
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  };

  const allBlurred = cards.length > 0 && cards.every(c => c.isBlurred);

  const handleBlurAll = async (blur: boolean) => {
    const toUpdate = cards.filter(c => c.isBlurred !== blur);
    if (toUpdate.length === 0) return;
    const results = await Promise.allSettled(
      toUpdate.map(c => updateCardAsync({ id: c.id, payload: { isBlurred: blur } })),
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed === 0) {
      Toast.show({ type: 'success', text1: blur ? 'All cards blurred' : 'All cards unblurred' });
    } else {
      Toast.show({ type: 'error', text1: `${toUpdate.length - failed} updated, ${failed} failed` });
    }
  };

  const handleMoveCard = (targetSetId: string) => {
    if (!moveTargetCard) return;
    moveCard({ id: moveTargetCard.id, payload: { targetSetId } }, {
      onSuccess: () => {
        setMovePickerOpen(false);
        setMoveTargetCard(null);
        Toast.show({ type: 'success', text1: 'Card moved' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Move failed', text2: getErrorMessage(err) }),
    });
  };

  const handleEnterReorder = () => {
    setOrderedCards([...cards]);
    setReorderMode(true);
  };

  const handleSaveReorder = () => {
    reorderCards({ setId, cardIds: orderedCards.map(c => c.id) }, {
      onSuccess: () => {
        setReorderMode(false);
        setOrderedCards([]);
        Toast.show({ type: 'success', text1: 'Order saved' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Failed to save order', text2: getErrorMessage(err) }),
    });
  };

  const handleCancelReorder = () => {
    setReorderMode(false);
    setOrderedCards([]);
  };

  const handleSaveNote = () => {
    if (!noteCard) return;
    setSavingNote(true);
    updateCard({ id: noteCard.id, payload: { note: noteText.trim() || null } }, {
      onSuccess: () => {
        setSavingNote(false);
        setNoteCard(null);
        Toast.show({ type: 'success', text1: 'Note saved' });
      },
      onError: (err: unknown) => {
        setSavingNote(false);
        Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
      },
    });
  };

  const handleDelete = (cardId: string) => {
    show({
      title: 'Delete Card',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCardAsync(cardId);
          Toast.show({ type: 'success', text1: 'Card deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
        }
      },
    });
  };

  // ── Header (normal vs reorder) ──
  const header = reorderMode ? (
    <View style={[styles.reorderBar, { borderBottomColor: colors.border }]}>
      <Pressable onPress={handleCancelReorder} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
        <Typography preset="bodySm" color={colors.textSecondary}>Cancel</Typography>
      </Pressable>
      <Typography preset="bodySm" style={styles.reorderTitle}>Reorder Cards</Typography>
      <Pressable onPress={handleSaveReorder} disabled={isReordering} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
        {isReordering
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Typography preset="bodySm" color={colors.accent} style={styles.reorderTitle}>Save</Typography>
        }
      </Pressable>
    </View>
  ) : (
    <View>
      <ScreenHeader
        title={cachedTitle ?? setTitle}
        onBack={() => navigation.goBack()}
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
            <Pressable onPress={() => setHeaderMenuOpen(true)} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <MoreVerticalIcon size={ICON_SIZE} color={colors.textSecondary} />
            </Pressable>
          </>
        }
      />
      <Typography preset="bodySm" color={colors.textSecondary} style={styles.count}>
        {cards.length} {cards.length === 1 ? 'card' : 'cards'}
      </Typography>
      {cardSearchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Search cards…"
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
        <ErrorState message="Could not load cards." onRetry={refetch} />
      </Screen>
    );
  }

  // ── Normal card (list / grid) ──
  const renderCard = ({ item }: { item: CardType }) => (
    <View style={[styles.cardItem, !isDark && styles.cardShadow, cardLayout === 'grid' && styles.cardItemGrid]}>
      <View style={[styles.questionSection, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderBottomColor: colors.border }, cardLayout === 'grid' && styles.questionSectionGrid]}>
        <Typography preset="body" style={styles.question} numberOfLines={cardLayout === 'grid' ? 3 : undefined}>
          {item.question}
        </Typography>
        {isOwner ? (
          <View style={styles.cardActions}>
            <Pressable onPress={() => { setNoteCard(item); setNoteText(item.note ?? ''); }} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
              <InfoIcon size={ICON_SIZE} color={colors.textDisabled} />
            </Pressable>
            <Pressable onPress={() => handleBlurToggle(item)} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
              {item.isBlurred ? <EyeOffIcon size={ICON_SIZE} color={colors.textDisabled} /> : <EyeIcon size={ICON_SIZE} color={colors.textDisabled} />}
            </Pressable>
            <Pressable onPress={() => setSelectedCard(item)} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}>
              <MoreVerticalIcon size={ICON_SIZE} color={colors.textDisabled} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.answerSection, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, cardLayout === 'grid' && styles.answerSectionGrid]}>
        {item.isBlurred && isOwner ? (
          <View style={styles.blurOverlay}>
            <Typography preset="bodySm" color={colors.textDisabled}>Tap eye icon to reveal answer</Typography>
          </View>
        ) : (
          <>
            <Typography preset="body" color={colors.textSecondary} style={styles.answer} numberOfLines={cardLayout === 'grid' ? 2 : undefined}>
              {item.answer}
            </Typography>
            {item.note && cardLayout === 'list' ? (
              <>
                <Divider marginV={spacing.sm} />
                <Typography preset="caption" color={colors.textSecondary}>Note</Typography>
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

  // ── Reorder card (drag handle) ──
  const renderReorderCard = ({ item, drag, isActive }: RenderItemParams<CardType>) => (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
        style={({ pressed }) => [styles.cardItem, isActive && styles.cardItemActive, pressed && !isActive && styles.cardPressed]}
      >
        <View style={[styles.questionSection, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderBottomColor: colors.border }]}>
          <Typography preset="body" style={styles.question} numberOfLines={2}>
            {item.question}
          </Typography>
          <View style={styles.cardActions}>
            <ReorderIcon size={ICON_SIZE} color={colors.textSecondary} />
          </View>
        </View>
        <View style={[styles.answerSection, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }]}>
          <Typography preset="body" color={colors.textSecondary} style={styles.answer} numberOfLines={2}>
            {item.answer}
          </Typography>
        </View>
      </Pressable>
    </ScaleDecorator>
  );

  return (
    <Screen header={header}>
      {reorderMode ? (
        <View style={styles.flex}>
        <DraggableFlatList
          data={orderedCards}
          onDragEnd={({ data }) => setOrderedCards(data)}
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
                title={cardSearch ? 'No results' : 'No cards yet'}
                subtitle={cardSearch ? `No cards match "${cardSearch}"` : isOwner ? 'Add cards to start studying this set' : 'This set has no cards yet'}
                ctaLabel={cardSearch || !isOwner ? undefined : 'Add Cards'}
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
        title="Card options"
        onClose={() => setSelectedCard(null)}
        actions={[
          { label: 'Edit', icon: PencilIcon, onPress: () => selectedCard && navigation.navigate('EditCard', { cardId: selectedCard.id, setId }) },
          { label: 'Copy', icon: CopyIcon, onPress: () => selectedCard && handleCopyCard(selectedCard.id) },
          { label: 'Move to Set', icon: ArrowRightIcon, onPress: () => { setMoveTargetCard(selectedCard); setMovePickerOpen(true); } },
          {
            label: 'Ask AI', icon: SparklesIcon, onPress: () => {
              if (!selectedCard) return;
              const prompt = `Explain this flashcard:\nQ: ${selectedCard.question}\nA: ${selectedCard.answer}`;
              navigation.navigate('AITab', { screen: 'AIChat', params: { autoSend: prompt } });
            },
          },
          { label: 'Delete', icon: TrashIcon, destructive: true, onPress: () => selectedCard && handleDelete(selectedCard.id) },
        ]}
      />

      {/* ── Move to set picker ── */}
      <SelectSheet
        visible={movePickerOpen}
        title="Move to Set"
        searchPlaceholder="Search sets…"
        options={allSets.filter(s => s.id !== setId).map(s => ({ id: s.id, label: s.title }))}
        onSelect={handleMoveCard}
        onClose={() => { setMovePickerOpen(false); setMoveTargetCard(null); }}
        emptyText="No other sets available"
      />

      {/* ── Header menu ── */}
      <ActionSheet
        visible={headerMenuOpen}
        title={cachedTitle ?? setTitle}
        onClose={() => setHeaderMenuOpen(false)}
        actions={[
          { label: 'Quiz', icon: HelpCircleIcon, onPress: () => { setHeaderMenuOpen(false); setTimeout(() => setQuizSheetOpen(true), 350); } },
          ...(isOwner ? [
            { label: 'Create Card', icon: PlusCircleIcon, onPress: () => navigation.navigate('CreateCard', { setId }) },
            { label: 'Edit Set', icon: PencilIcon, onPress: () => navigation.navigate('EditSet', { setId }) },
            { label: allBlurred ? 'Unblur All' : 'Blur All', icon: allBlurred ? EyeIcon : EyeOffIcon, onPress: () => handleBlurAll(!allBlurred) },
            ...(!isLoading && cards.length > 1 ? [{ label: 'Reorder Cards', icon: ReorderIcon, onPress: handleEnterReorder }] : []),
          ] : []),
          { label: cardLayout === 'grid' ? 'List View' : 'Grid View', icon: cardLayout === 'grid' ? ListIcon : GridIcon, onPress: () => setCardLayout(l => l === 'list' ? 'grid' : 'list') },
        ]}
      />

      <QuizModeSheet
        visible={quizSheetOpen}
        setIds={[setId]}
        setTitles={[cachedTitle ?? setTitle]}
        onClose={() => setQuizSheetOpen(false)}
        onStart={(mode, setIds, setTitles) => navigation.navigate('Quiz', { setIds, setTitles, mode })}
      />

      {/* ── Note popup ── */}
      <AppModal
        visible={!!noteCard}
        title="Note"
        onClose={() => { setNoteCard(null); setNoteText(''); }}
      >
        <TextInput
          style={[styles.notePopupInput, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
          placeholder="Add a note…"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
          maxLength={2000}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="sentences"
        />
        <Divider />
        <Button label="Save Note" onPress={handleSaveNote} loading={savingNote} fullWidth />
        <Button
          label="Edit Card"
          variant="secondary"
          onPress={() => {
            const c = noteCard;
            setNoteCard(null);
            if (c) navigation.navigate('EditCard', { cardId: c.id, setId });
          }}
          fullWidth
        />
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  question: { flex: 1, fontWeight: fontWeights.medium, lineHeight: fontSizes.md * lineHeights.normal },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  answerSection: {
    padding: spacing.lg,
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
