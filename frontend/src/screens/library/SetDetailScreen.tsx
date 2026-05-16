import React, { useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState } from '../../components/feedback';
import { Button, Divider, Input, Typography } from '../../components/ui';

const ICON_SIZE = 20;
import { useCards, useConfirmDialog, useCopyCard, useDeleteCard, useMoveCard, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, shadows, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
  const { setId, setTitle } = route.params;
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [noteCard, setNoteCard] = useState<CardType | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [cardLayout, setCardLayout] = useState<'list' | 'grid'>('list');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [cardSearchVisible, setCardSearchVisible] = useState(false);

  const { data: cards = [], isLoading, isError, refetch } = useCards(setId);
  const { data: allSets = [] } = useSets();
  const { mutateAsync: deleteCardAsync } = useDeleteCard(setId);
  const { show, dialogProps } = useConfirmDialog();
  const { mutate: copyCard }   = useCopyCard(setId);
  const { mutate: moveCard }   = useMoveCard(setId);
  const { mutate: updateCard, mutateAsync: updateCardAsync } = useUpdateCard(setId);

  const handleShare = async () => {
    const cardList = filteredCards
      .map((c, i) => `${i + 1}. ${c.question}\n   ${c.answer}`)
      .join('\n\n');
    const divider = '─'.repeat(Math.min(setTitle.length, 40));
    await Share.share({ message: `${setTitle}\n${divider}\n\n${cardList}` });
  };

  const toggleCardSearch = () => {
    if (cardSearchVisible) setCardSearch('');
    setCardSearchVisible(v => !v);
  };

  const filteredCards = cardSearch.trim()
    ? cards.filter(
        c =>
          c.question.toLowerCase().includes(cardSearch.toLowerCase()) ||
          c.answer.toLowerCase().includes(cardSearch.toLowerCase()),
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
    try {
      await Promise.all(
        toUpdate.map(c => updateCardAsync({ id: c.id, payload: { isBlurred: blur } })),
      );
      Toast.show({ type: 'success', text1: blur ? 'All cards blurred' : 'All cards unblurred' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not update all cards' });
    }
  };

  const handleMoveCard = (targetSetId: string) => {
    if (!selectedCard) return;
    moveCard({ id: selectedCard.id, payload: { targetSetId } }, {
      onSuccess: () => {
        setMovePickerOpen(false);
        setSelectedCard(null);
        Toast.show({ type: 'success', text1: 'Card moved' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Move failed', text2: getErrorMessage(err) }),
    });
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

  if (isError) {
    return <ErrorState message="Could not load cards." onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── Stats bar ── */}
      <View style={styles.statsBar}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </Typography>
        <View style={styles.statsBarActions}>
          <Pressable onPress={toggleCardSearch} hitSlop={8}>
            <Icon name="search-outline" size={ICON_SIZE} color={cardSearchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
          {cards.length > 0 && (
            <Pressable onPress={handleShare} hitSlop={8}>
              <Icon name="share-social-outline" size={ICON_SIZE} color={colors.textSecondary} />
            </Pressable>
          )}
          <Pressable onPress={() => setHeaderMenuOpen(true)} hitSlop={8} style={styles.menuBtn}>
            <Icon name="ellipsis-vertical" size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
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

      <FlatList
        key={cardLayout}
        data={filteredCards}
        keyExtractor={item => item.id}
        numColumns={cardLayout === 'grid' ? 2 : 1}
        columnWrapperStyle={cardLayout === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={cardSearch ? 'No results' : 'No cards yet'}
              subtitle={cardSearch ? `No cards match "${cardSearch}"` : 'Add cards to start studying this set'}
              ctaLabel={cardSearch ? undefined : 'Add Cards'}
              onCta={cardSearch ? undefined : () => navigation.navigate('CreateCard', { setId })}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.cardItem, cardLayout === 'grid' && styles.cardItemGrid]}>
            {/* Question section — gray background */}
            <View style={[styles.questionSection, cardLayout === 'grid' && styles.questionSectionGrid]}>
              <Typography preset="body" style={styles.question} numberOfLines={cardLayout === 'grid' ? 3 : undefined}>
                {item.question}
              </Typography>
              <View style={styles.cardActions}>
                <Pressable onPress={() => { setNoteCard(item); setNoteText(item.note ?? ''); }} hitSlop={6} style={styles.iconBtn}>
                  <Icon name="information-circle-outline" size={ICON_SIZE} color={colors.textDisabled} />
                </Pressable>
                <Pressable onPress={() => handleBlurToggle(item)} hitSlop={6} style={styles.iconBtn}>
                  <Icon name={item.isBlurred ? 'eye-off-outline' : 'eye-outline'} size={ICON_SIZE} color={colors.textDisabled} />
                </Pressable>
                <Pressable onPress={() => setSelectedCard(item)} hitSlop={6} style={styles.iconBtn}>
                  <Icon name="ellipsis-vertical" size={ICON_SIZE} color={colors.textDisabled} />
                </Pressable>
              </View>
            </View>

            {/* Answer section — white background */}
            <View style={[styles.answerSection, cardLayout === 'grid' && styles.answerSectionGrid]}>
              {item.isBlurred ? (
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
          {
            label: 'Edit',
            iconName: 'pencil-outline',
            onPress: () =>
              selectedCard &&
              navigation.navigate('EditCard', { cardId: selectedCard.id, setId }),
          },
          {
            label: 'Copy',
            iconName: 'copy-outline',
            onPress: () => selectedCard && handleCopyCard(selectedCard.id),
          },
          {
            label: 'Move to Set',
            iconName: 'arrow-forward-outline',
            onPress: () => setMovePickerOpen(true),
          },
          {
            label: 'Delete',
            iconName: 'trash-outline',
            destructive: true,
            onPress: () => selectedCard && handleDelete(selectedCard.id),
          },
        ]}
      />

      {/* ── Move to set picker ── */}
      <AppModal
        visible={movePickerOpen}
        title="Move to Set"
        onClose={() => setMovePickerOpen(false)}
      >
        {allSets.filter(s => s.id !== setId).length === 0 ? (
          <Typography preset="bodySm" color={colors.textSecondary}>
            No other sets available
          </Typography>
        ) : (
          allSets
            .filter(s => s.id !== setId)
            .map(s => (
              <React.Fragment key={s.id}>
                <Pressable style={styles.setOption} onPress={() => handleMoveCard(s.id)}>
                  <Typography preset="body">{s.title}</Typography>
                </Pressable>
                <Divider marginV={spacing[1]} />
              </React.Fragment>
            ))
        )}
      </AppModal>

      {/* ── Header menu ── */}
      <ActionSheet
        visible={headerMenuOpen}
        title={setTitle}
        onClose={() => setHeaderMenuOpen(false)}
        actions={[
          {
            label: 'Study Set',
            iconName: 'book-outline',
            onPress: () => navigation.navigate('Study', { setId, setTitle }),
          },
          {
            label: 'Create Card',
            iconName: 'add-circle-outline',
            onPress: () => navigation.navigate('CreateCard', { setId }),
          },
          {
            label: 'Edit Set',
            iconName: 'pencil-outline',
            onPress: () => navigation.navigate('EditSet', { setId }),
          },
          {
            label: allBlurred ? 'Unblur All' : 'Blur All',
            iconName: allBlurred ? 'eye-outline' : 'eye-off-outline',
            onPress: () => handleBlurAll(!allBlurred),
          },
          {
            label: cardLayout === 'grid' ? 'List View' : 'Grid View',
            iconName: cardLayout === 'grid' ? 'list-outline' : 'grid-outline',
            onPress: () => setCardLayout(l => l === 'list' ? 'grid' : 'list'),
          },
        ]}
      />

      {/* ── Note popup ── */}
      <AppModal
        visible={!!noteCard}
        title="Note"
        onClose={() => setNoteCard(null)}
      >
        <TextInput
          style={styles.notePopupInput}
          placeholder="Add a note…"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing[8],
  },
  separator: { height: spacing[3] },
  cardItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
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
    backgroundColor: colors.background,
    padding: spacing[4],
  },
  answer: { lineHeight: 22 },
  note: { lineHeight: 20 },
  blurOverlay: { alignItems: 'center', paddingVertical: spacing[2] },
  setOption: { paddingVertical: spacing[3] },
  statsBarActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  menuBtn: { paddingHorizontal: spacing[2] },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3] },
  searchInput: { marginBottom: 0 },
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
