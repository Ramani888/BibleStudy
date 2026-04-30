import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ActionSheet, AppModal, EmptyState, ErrorState } from '../../components/feedback';
import { Button, Divider, Typography } from '../../components/ui';
import { useCards, useCopyCard, useDeleteCard, useMoveCard, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, shadows, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { Card as CardType } from '../../types';

export function SetDetailScreen({ navigation, route }: LibraryScreenProps<'SetDetail'>) {
  const { setId, setTitle } = route.params;
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [noteCard, setNoteCard] = useState<CardType | null>(null);

  const { data: cards = [], isLoading, isError, refetch } = useCards(setId);
  const { data: allSets = [] } = useSets();
  const { mutate: deleteCard } = useDeleteCard(setId);
  const { mutate: copyCard }   = useCopyCard(setId);
  const { mutate: moveCard }   = useMoveCard(setId);
  const { mutate: updateCard } = useUpdateCard(setId);

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

  const handleDelete = (cardId: string) => {
    Alert.alert('Delete Card', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteCard(cardId, {
            onSuccess: () => Toast.show({ type: 'success', text1: 'Card deleted' }),
            onError: err => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
          }),
      },
    ]);
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
        <Pressable onPress={() => navigation.navigate('CreateCard', { setId })} hitSlop={8}>
          <Typography preset="label" color={colors.primary}>+ Add Cards</Typography>
        </Pressable>
      </View>

      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No cards yet"
              subtitle="Add cards to start studying this set"
              ctaLabel="Add Cards"
              onCta={() => navigation.navigate('CreateCard', { setId })}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            {/* Question section — gray background */}
            <View style={styles.questionSection}>
              <Typography preset="body" style={styles.question}>
                {item.question}
              </Typography>
              <View style={styles.cardActions}>
                <Pressable onPress={() => setNoteCard(item)} hitSlop={6} style={styles.iconBtn}>
                  <Typography style={styles.iconText}>ℹ️</Typography>
                </Pressable>
                <Pressable onPress={() => handleBlurToggle(item)} hitSlop={6} style={styles.iconBtn}>
                  <Typography style={styles.iconText}>{item.isBlurred ? '🙈' : '👁️'}</Typography>
                </Pressable>
                <Pressable onPress={() => setSelectedCard(item)} hitSlop={6} style={styles.iconBtn}>
                  <Typography style={styles.iconText}>⋮</Typography>
                </Pressable>
              </View>
            </View>

            {/* Answer section — white background */}
            <View style={styles.answerSection}>
              {item.isBlurred ? (
                <View style={styles.blurOverlay}>
                  <Typography preset="bodySm" color={colors.textDisabled}>Tap 👁 to reveal answer</Typography>
                </View>
              ) : (
                <>
                  <Typography preset="body" color={colors.textSecondary} style={styles.answer}>
                    {item.answer}
                  </Typography>
                  {item.note ? (
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
            label: '✏️ Edit',
            onPress: () =>
              selectedCard &&
              navigation.navigate('EditCard', { cardId: selectedCard.id, setId }),
          },
          {
            label: '📋 Copy',
            onPress: () => selectedCard && handleCopyCard(selectedCard.id),
          },
          {
            label: '➡️ Move to Set',
            onPress: () => setMovePickerOpen(true),
          },
          {
            label: '🗑 Delete',
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

      {/* ── Note popup ── */}
      <AppModal
        visible={!!noteCard}
        title="Note"
        onClose={() => setNoteCard(null)}
      >
        {noteCard?.note ? (
          <Typography preset="body">{noteCard.note}</Typography>
        ) : (
          <Typography preset="bodySm" color={colors.textSecondary}>No note on this card.</Typography>
        )}
        <Divider />
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
  iconText: { fontSize: 18, lineHeight: 22 },
  answerSection: {
    backgroundColor: colors.background,
    padding: spacing[4],
  },
  answer: { lineHeight: 22 },
  note: { lineHeight: 20 },
  blurOverlay: { alignItems: 'center', paddingVertical: spacing[2] },
  setOption: { paddingVertical: spacing[3] },
});
