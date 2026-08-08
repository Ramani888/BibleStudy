import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircleIcon } from '../../../components/icons';

import { AppModal } from '../../../components/feedback';
import { Button, Input, Typography } from '../../../components/ui';
import { useCreateSet, useSets } from '../../../hooks';
import { getErrorMessage } from '../../../api';
import Toast from 'react-native-toast-message';
import { layout, spacing, useTheme, type Theme } from '../../../theme';
import type { SuggestedCard } from '../../../types';

interface CardProposalSheetProps {
  visible: boolean;
  cards: SuggestedCard[];
  onSave: (setId: string) => Promise<void>;
  onClose: () => void;
}

export function CardProposalSheet({ visible, cards, onSave, onClose }: CardProposalSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
          <View key={i} style={styles.cardRow}>
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
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : sets.length === 0 ? (
        <Typography preset="bodySm" color={colors.textSecondary} style={styles.emptyText}>
          No sets yet — create one above.
        </Typography>
      ) : (
        <ScrollView style={styles.setList} showsVerticalScrollIndicator={false}>
          {sets.map(set => (
            <Pressable
              key={set.id}
              style={[styles.setRow, selectedSetId === set.id && styles.setRowSelected]}
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
                <CheckCircleIcon size={20} color={colors.primary} />
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

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  subheader: { marginBottom: spacing[3] },
  previewScroll: { maxHeight: 180, marginBottom: spacing[4] },
  cardRow: {
    gap: spacing[1],
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  answerText: { paddingLeft: spacing[2] },
  sectionLabel: { marginBottom: spacing[2] },
  createRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginBottom: spacing[3] },
  createInput: { flex: 1 },
  loader: { marginVertical: spacing[4] },
  emptyText: { textAlign: 'center', marginVertical: spacing[4] },
  setList: { maxHeight: 220, marginBottom: spacing[4] },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: spacing[2.5],
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing[2],
  },
  setRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  setColor: { width: 12, height: 12, borderRadius: spacing[1.5] },
  setInfo: { flex: 1 },
  footer: { marginTop: spacing[2] },
});
