import React, { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState, SelectSheet } from '../../components/feedback';
import { Button, Divider, Input, Screen, ScreenHeader, Typography } from '../../components/ui';
import {
  SearchIcon, ShareIcon, MoreVerticalIcon, ChevronUpIcon, ChevronDownIcon, InfoIcon, EyeIcon, EyeOffIcon,
  HelpCircleIcon, PlusCircleIcon, PencilIcon, CopyIcon, ArrowRightIcon, SparklesIcon, TrashIcon, ReorderIcon,
  ListIcon, GridIcon,
} from '../../components/icons';

import { useCards, useConfirmDialog, useCopyCard, useDeleteCard, useMoveCard, useReorderCards, useSearchToggle, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

const ICON_SIZE = 20;

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors, spacing } = theme;

  const { setId, setTitle, isOwner = true } = route.params;
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [moveTargetCard, setMoveTargetCard] = useState<CardType | null>(null);
  const [noteCard, setNoteCard] = useState<CardType | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('list');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const { query: cardSearch, setQuery: setCardSearch, visible: cardSearchVisible, toggle: toggleCardSearch } = useSearchToggle();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedCards, setOrderedCards] = useState<CardType[]>([]);

  const { data: cards = [], isLoading, isRefetching, isError, refetch } = useCards(setId);
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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setOrderedCards(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    setOrderedCards(prev => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
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
    <View style={styles.reorderBar}>
      <Pressable onPress={handleCancelReorder} hitSlop={8}>
        <Typography preset="bodySm" color={colors.textSecondary}>Cancel</Typography>
      </Pressable>
      <Typography preset="bodySm" style={styles.reorderTitle}>Reorder Cards</Typography>
      <Pressable onPress={handleSaveReorder} disabled={isReordering} hitSlop={8}>
        {isReordering
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Typography preset="bodySm" color={colors.primary} style={styles.reorderTitle}>Save</Typography>
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
            <Pressable onPress={toggleCardSearch} hitSlop={8}>
              <SearchIcon size={ICON_SIZE} color={cardSearchVisible ? colors.primary : colors.textSecondary} />
            </Pressable>
            {cards.length > 0 && (
              <Pressable onPress={handleShare} hitSlop={8}>
                <ShareIcon size={ICON_SIZE} color={colors.textSecondary} />
              </Pressable>
            )}
            <Pressable onPress={() => setHeaderMenuOpen(true)} hitSlop={8}>
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
          <Input
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

  // ── Footer (primary study action) — hidden in reorder mode / when empty ──
  const footer = !reorderMode && cards.length > 0 ? (
    <View style={styles.footer}>
      <Button
        label="Start Quiz"
        onPress={() => navigation.navigate('QuizModePicker', { setId, setTitle: cachedTitle ?? setTitle, isOwner })}
        fullWidth
      />
    </View>
  ) : undefined;

  if (isError) {
    return (
      <Screen header={header}>
        <ErrorState message="Could not load cards." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={footer}>
      <FlatList
        key={reorderMode ? 'reorder' : cardLayout}
        data={reorderMode ? orderedCards : filteredCards}
        keyExtractor={item => item.id}
        numColumns={reorderMode ? 1 : (cardLayout === 'grid' ? 2 : 1)}
        columnWrapperStyle={!reorderMode && cardLayout === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={!reorderMode && isRefetching}
        onRefresh={reorderMode ? undefined : refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.listLoader} />
          ) : (
            <EmptyState
              title={cardSearch ? 'No results' : 'No cards yet'}
              subtitle={cardSearch ? `No cards match "${cardSearch}"` : isOwner ? 'Add cards to start studying this set' : 'This set has no cards yet'}
              ctaLabel={cardSearch || !isOwner ? undefined : 'Add Cards'}
              onCta={cardSearch || !isOwner ? undefined : () => navigation.navigate('CreateCard', { setId })}
            />
          )
        }
        renderItem={({ item, index }) => (
          <View style={[styles.cardItem, !reorderMode && cardLayout === 'grid' && styles.cardItemGrid]}>
            {/* Question section */}
            <View style={[styles.questionSection, !reorderMode && cardLayout === 'grid' && styles.questionSectionGrid]}>
              <Typography preset="body" style={styles.question} numberOfLines={!reorderMode && cardLayout === 'grid' ? 3 : undefined}>
                {item.question}
              </Typography>
              {reorderMode ? (
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleMoveUp(index)} disabled={index === 0} hitSlop={6} style={styles.iconBtn}>
                    <ChevronUpIcon size={ICON_SIZE} color={index === 0 ? colors.textDisabled : colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleMoveDown(index)} disabled={index === orderedCards.length - 1} hitSlop={6} style={styles.iconBtn}>
                    <ChevronDownIcon size={ICON_SIZE} color={index === orderedCards.length - 1 ? colors.textDisabled : colors.textSecondary} />
                  </Pressable>
                </View>
              ) : isOwner ? (
                <View style={styles.cardActions}>
                  <Pressable onPress={() => { setNoteCard(item); setNoteText(item.note ?? ''); }} hitSlop={6} style={styles.iconBtn}>
                    <InfoIcon size={ICON_SIZE} color={colors.textDisabled} />
                  </Pressable>
                  <Pressable onPress={() => handleBlurToggle(item)} hitSlop={6} style={styles.iconBtn}>
                    {item.isBlurred ? <EyeOffIcon size={ICON_SIZE} color={colors.textDisabled} /> : <EyeIcon size={ICON_SIZE} color={colors.textDisabled} />}
                  </Pressable>
                  <Pressable onPress={() => setSelectedCard(item)} hitSlop={6} style={styles.iconBtn}>
                    <MoreVerticalIcon size={ICON_SIZE} color={colors.textDisabled} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Answer section */}
            <View style={[styles.answerSection, !reorderMode && cardLayout === 'grid' && styles.answerSectionGrid]}>
              {item.isBlurred && isOwner && !reorderMode ? (
                <View style={styles.blurOverlay}>
                  <Typography preset="bodySm" color={colors.textDisabled}>Tap eye icon to reveal answer</Typography>
                </View>
              ) : (
                <>
                  <Typography preset="body" color={colors.textSecondary} style={styles.answer} numberOfLines={!reorderMode && cardLayout === 'grid' ? 2 : undefined}>
                    {item.answer}
                  </Typography>
                  {item.note && !reorderMode && cardLayout === 'list' ? (
                    <>
                      <Divider marginV={spacing[2]} />
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
        )}
      />

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
          { label: 'Quiz', icon: HelpCircleIcon, onPress: () => navigation.navigate('QuizModePicker', { setId, setTitle: cachedTitle ?? setTitle, isOwner }) },
          ...(isOwner ? [
            { label: 'Create Card', icon: PlusCircleIcon, onPress: () => navigation.navigate('CreateCard', { setId }) },
            { label: 'Edit Set', icon: PencilIcon, onPress: () => navigation.navigate('EditSet', { setId }) },
            { label: allBlurred ? 'Unblur All' : 'Blur All', icon: allBlurred ? EyeIcon : EyeOffIcon, onPress: () => handleBlurAll(!allBlurred) },
            ...(!isLoading && cards.length > 1 ? [{ label: 'Reorder Cards', icon: ReorderIcon, onPress: handleEnterReorder }] : []),
          ] : []),
          { label: cardLayout === 'grid' ? 'List View' : 'Grid View', icon: cardLayout === 'grid' ? ListIcon : GridIcon, onPress: () => setCardLayout(l => l === 'list' ? 'grid' : 'list') },
        ]}
      />

      {/* ── Note popup ── */}
      <AppModal
        visible={!!noteCard}
        title="Note"
        onClose={() => { setNoteCard(null); setNoteText(''); }}
      >
        <TextInput
          style={styles.notePopupInput}
          placeholder="Add a note…"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
          maxLength={2000}
          placeholderTextColor={colors.textDisabled}
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    reorderBar: {
      minHeight: layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    reorderTitle: { fontWeight: '600' },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    count: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[2] },
    searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[3] },
    searchInput: { marginBottom: 0 },
    list: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[8],
    },
    listLoader: { marginTop: spacing[8] },
    separator: { height: spacing[3] },
    cardItem: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    questionSection: {
      backgroundColor: colors.backgroundSecondary,
      padding: spacing[4],
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[3],
    },
    question: { flex: 1, fontWeight: '500', lineHeight: 22 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    iconBtn: { padding: spacing[1] },
    answerSection: {
      backgroundColor: colors.backgroundCard,
      padding: spacing[4],
    },
    answer: { lineHeight: 22 },
    note: { lineHeight: 20 },
    blurOverlay: { alignItems: 'center', paddingVertical: spacing[2] },
    gridRow: { gap: spacing[3] },
    cardItemGrid: { flex: 1 },
    questionSectionGrid: { padding: spacing[3] },
    answerSectionGrid: { padding: spacing[3] },
    notePopupInput: {
      borderWidth: 1.5,
      borderRadius: 12,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      minHeight: 80,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
  });
