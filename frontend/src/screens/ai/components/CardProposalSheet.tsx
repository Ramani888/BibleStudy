import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircleIcon } from '../../../components/icons';

import { AppModal } from '../../../components/feedback';
import { Button, Input, Typography } from '../../../components/ui';
import { useCreateSet, useSets } from '../../../hooks';
import { getErrorMessage } from '../../../api';
import Toast from 'react-native-toast-message';
import { CARD_FILL_LIGHT, radius, spacing, useTheme } from '../../../theme';
import type { SuggestedCard } from '../../../types';

interface CardProposalSheetProps {
  visible: boolean;
  cards: SuggestedCard[];
  onSave: (setId: string) => Promise<void>;
  onClose: () => void;
}

export const CardProposalSheet = React.memo(function CardProposalSheet({ visible, cards, onSave, onClose }: CardProposalSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: sets = [], isLoading: setsLoading } = useSets();
  const { mutateAsync: createSet } = useCreateSet();

  const handleCreateSet = useCallback(async () => {
    const title = newSetName.trim();
    if (!title || isCreating) return;
    setIsCreating(true);
    try {
      const set = await createSet({ title });
      setSelectedSetId(set.id);
      setNewSetName('');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not create set', text2: getErrorMessage(e) });
    } finally {
      setIsCreating(false);
    }
  }, [newSetName, isCreating, createSet]);

  const handleSave = useCallback(async () => {
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
  }, [selectedSetId, onSave]);

  const handleClose = useCallback(() => {
    setSelectedSetId(null);
    setNewSetName('');
    onClose();
  }, [onClose]);

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
              style={({ pressed }) => [
                styles.setRow,
                { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border },
                selectedSetId === set.id && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                { opacity: pressed ? 0.7 : 1 },
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
});

const styles = StyleSheet.create({
  subheader: { marginBottom: spacing.md },
  previewScroll: { maxHeight: 180 /* ponytail: off-grid Figma value */, marginBottom: spacing.lg },
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
  setList: { maxHeight: 220 /* ponytail: off-grid Figma value */, marginBottom: spacing.lg },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.r10,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  setColor: { width: spacing.md, height: spacing.md, borderRadius: radius.r6 },
  setInfo: { flex: 1 },
  footer: { marginTop: spacing.sm },
});
