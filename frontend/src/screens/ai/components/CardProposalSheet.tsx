import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircleIcon } from '../../../components/icons';

import { AppModal } from '../../../components/feedback';
import { Button, Input, Typography } from '../../../components/ui';
import { useCreateSet, useSets } from '../../../hooks';
import { getErrorMessage } from '../../../api';
import Toast from 'react-native-toast-message';
import { layout, spacing, useTheme } from '../../../theme';
import type { SuggestedCard } from '../../../types';

interface CardProposalSheetProps {
  visible: boolean;
  cards: SuggestedCard[];
  onSave: (setId: string) => Promise<void>;
  onClose: () => void;
}

export function CardProposalSheet({ visible, cards, onSave, onClose }: CardProposalSheetProps) {
  const { colors } = useTheme();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: sets = [], isLoading: setsLoading } = useSets();
  const { mutateAsync: createSet } = useCreateSet();

  const handleCreateSet = async () => {
    const title = newSetName.trim();
    if (!title || isCreating) return;
    setIsCreating(true);
    try {
      const set = await createSet({ title });
      setSelectedSetId(set.id);   // auto-select the new set, ready to save into it
      setNewSetName('');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not create set', text2: getErrorMessage(e) });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSetId) return;
    setIsSaving(true);
    try {
      await onSave(selectedSetId);
      setSelectedSetId(null);
    } catch {
      // error already handled (toast shown) in onSave — swallow here
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedSetId(null);
    setNewSetName('');
    onClose();
  };

  return (
    <AppModal visible={visible} title="Save as Flashcards" onClose={handleClose} showHandle>
      <Typography preset="bodySm" color={colors.textSecondary} style={styles.subheader}>
        {cards.length} card{cards.length !== 1 ? 's' : ''} ready to save
      </Typography>

      {/* Card preview */}
      <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
        {cards.map((card, i) => (
          <View key={i} style={[styles.cardRow, { borderBottomColor: colors.border }]}>
            <Typography preset="label" color={colors.textSecondary}>Q: {card.question}</Typography>
            <Typography preset="bodySm" color={colors.textPrimary} style={styles.answerText}>
              A: {card.answer}
            </Typography>
          </View>
        ))}
      </ScrollView>

      {/* Set selector */}
      <Typography preset="label" color={colors.textSecondary} style={styles.sectionLabel}>
        Choose a Set
      </Typography>

      {/* Inline create — only when the user has no sets to pick from */}
      {!setsLoading && sets.length === 0 && (
        <View style={styles.createRow}>
          <View style={styles.createInput}>
            <Input
              placeholder="New set name…"
              value={newSetName}
              onChangeText={setNewSetName}
              onSubmitEditing={handleCreateSet}
              returnKeyType="done"
              editable={!isCreating}
            />
          </View>
          <Button
            label="Create"
            variant="secondary"
            onPress={handleCreateSet}
            disabled={!newSetName.trim() || isCreating}
            loading={isCreating}
          />
        </View>
      )}

      {setsLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : sets.length === 0 ? (
        <Typography preset="bodySm" color={colors.textSecondary} style={styles.emptyText}>
          No sets yet — create one above.
        </Typography>
      ) : (
        <ScrollView style={styles.setList} showsVerticalScrollIndicator={false}>
          {sets.map(set => (
            <Pressable
              key={set.id}
              style={[
                styles.setRow,
                { borderColor: colors.border },
                selectedSetId === set.id && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
              ]}
              onPress={() => setSelectedSetId(set.id)}
            >
              {set.color && <View style={[styles.setColor, { backgroundColor: set.color }]} />}
              <View style={styles.setInfo}>
                <Typography preset="body" numberOfLines={1}>{set.title}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>
                  {set._count?.cards ?? 0} cards
                </Typography>
              </View>
              {selectedSetId === set.id && (
                <CheckCircleIcon size={20} color={colors.accent} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button
          label={`Save ${cards.length} Card${cards.length !== 1 ? 's' : ''}`}
          onPress={handleSave}
          disabled={!selectedSetId || isSaving}
          loading={isSaving}
          fullWidth
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  subheader: { marginBottom: spacing.md },
  previewScroll: { maxHeight: 180, marginBottom: spacing.lg },
  cardRow: {
    gap: spacing.xs,
    paddingVertical: spacing.s10,
    borderBottomWidth: 1,
  },
  answerText: { paddingLeft: spacing.sm },
  sectionLabel: { marginBottom: spacing.sm },
  createRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  createInput: { flex: 1 },
  loader: { marginVertical: spacing.lg },
  emptyText: { textAlign: 'center', marginVertical: spacing.lg },
  setList: { maxHeight: 220, marginBottom: spacing.lg },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.s10,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  setColor: { width: 12, height: 12, borderRadius: spacing.s6 },
  setInfo: { flex: 1 },
  footer: { marginTop: spacing.sm },
});
