import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMSheet } from '../../../components/qm';
import { AnimatedPressable, Typography } from '../../../components/ui';
import { CheckIcon } from '../../../components/icons';
import { useCreateSet, useSets } from '../../../hooks';
import { getErrorMessage } from '../../../api';
import { useTheme, spacing, radius, textPresets } from '../../../theme';
import type { SuggestedCard } from '../../../types';

const PREVIEW_W = 200;
const FIELD_H = 48;
const BTN_H = 52;
const ROW_H = 54;
const RADIO = 24;
const SWATCH = 12;
const NAME_MAX = 80;

interface CardProposalSheetProps {
  visible: boolean;
  cards: SuggestedCard[];
  onSave: (setId: string, setTitle: string) => Promise<void>;
  onClose: () => void;
}

/** "Save to a set": preview the AI's cards, pick or create a set, save. */
export const CardProposalSheet = React.memo(function CardProposalSheet({ visible, cards, onSave, onClose }: CardProposalSheetProps) {
  const { t } = useTranslation(['ai', 'library', 'common']);
  const { qm } = useTheme();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: sets = [], isLoading: setsLoading } = useSets();
  const { mutateAsync: createSet } = useCreateSet();
  const one = cards.length === 1;

  const handleCreateSet = useCallback(async () => {
    const title = newSetName.trim();
    if (!title || isCreating) return;
    setIsCreating(true);
    try {
      const set = await createSet({ title });
      setSelectedSetId(set.id);
      setNewSetName('');
    } catch (e) {
      Toast.show({ type: 'error', text1: t('library:sets.couldNotCreateSet', 'Could not create set'), text2: getErrorMessage(e) });
    } finally {
      setIsCreating(false);
    }
  }, [newSetName, isCreating, createSet, t]);

  const handleSave = useCallback(async () => {
    const set = sets.find(s => s.id === selectedSetId);
    if (!set) return;
    setIsSaving(true);
    try {
      await onSave(set.id, set.title);
      setSelectedSetId(null);
    } catch {
      // error already handled (toast shown) in onSave — swallow here
    } finally {
      setIsSaving(false);
    }
  }, [selectedSetId, sets, onSave]);

  const handleClose = useCallback(() => {
    setSelectedSetId(null);
    setNewSetName('');
    onClose();
  }, [onClose]);

  const nameOk = newSetName.trim().length > 0;
  const canSave = !!selectedSetId && !isSaving;

  return (
    <QMSheet
      visible={visible}
      onClose={handleClose}
      footer={
        <AnimatedPressable
          scaleTo={0.97}
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.save, canSave ? { backgroundColor: qm.violet, boxShadow: qm.btnShadow } : { backgroundColor: qm.field }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: isSaving }}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={qm.onViolet} />
            : (
              <Typography preset="qmButtonLg" color={canSave ? qm.onViolet : qm.muted}>
                {t('ai:qm.cards.save', { count: cards.length, defaultValue: one ? 'Save 1 card' : `Save ${cards.length} cards` })}
              </Typography>
            )}
        </AnimatedPressable>
      }
      title={one ? t('ai:qm.cards.oneTitle', 'Save as 1 card') : t('ai:qm.cards.title', 'Save to a set')}
      sub={one
        ? t('ai:qm.cards.oneSub', 'Your question on the front, the answer on the back.')
        : t('ai:qm.cards.sub', { count: cards.length, defaultValue: `${cards.length} cards ready. Pick a set for them.` })}
    >
      <View style={styles.body}>
        {one ? (
          <View style={[styles.preview, styles.previewOne, { backgroundColor: qm.field }]}>
            <Typography preset="qmLink" color={qm.ink} numberOfLines={3}>{cards[0].question}</Typography>
            <Typography preset="qmBody" color={qm.muted} style={[styles.previewA, styles.serif]} numberOfLines={4}>{cards[0].answer}</Typography>
          </View>
        ) : (
          // No height on the horizontal ScrollView — the wrapping View sizes it.
          <View style={styles.previewWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
              {cards.map((c, i) => (
                <View key={i} style={[styles.preview, { backgroundColor: qm.field }]}>
                  <Typography preset="qmLink" color={qm.ink} numberOfLines={3}>{c.question}</Typography>
                  <Typography preset="qmBody" color={qm.muted} style={[styles.previewA, styles.serif]} numberOfLines={3}>{c.answer}</Typography>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Typography preset="qmLink" color={qm.muted} style={styles.label}>{t('ai:qm.cards.choose', 'Choose a set')}</Typography>
        <View style={styles.createRow}>
          <BottomSheetTextInput
            value={newSetName}
            onChangeText={setNewSetName}
            onSubmitEditing={handleCreateSet}
            maxLength={NAME_MAX}
            returnKeyType="done"
            editable={!isCreating}
            placeholder={t('library:sets.newSetName', 'New set name…')}
            placeholderTextColor={qm.muted}
            accessibilityLabel={t('library:sets.newSetName', 'New set name…')}
            style={[styles.field, { backgroundColor: qm.field, color: qm.ink }]}
          />
          <AnimatedPressable
            scaleTo={0.95}
            onPress={handleCreateSet}
            disabled={!nameOk || isCreating}
            style={[styles.create, { backgroundColor: nameOk ? qm.violet : qm.field }]}
            accessibilityRole="button"
          >
            {isCreating
              ? <ActivityIndicator size="small" color={qm.onViolet} />
              : <Typography preset="qmSegment" color={nameOk ? qm.onViolet : qm.muted}>{t('common:actions.create', 'Create')}</Typography>}
          </AnimatedPressable>
        </View>

        {setsLoading ? (
          <ActivityIndicator color={qm.violet} style={styles.loader} />
        ) : sets.length === 0 ? (
          <Typography preset="qmBody" color={qm.muted} align="center" style={styles.none}>
            {t('ai:qm.cards.noSets', 'No sets yet — name a new one above.')}
          </Typography>
        ) : (
          <View accessibilityRole="radiogroup">
            {sets.map(set => {
              const on = selectedSetId === set.id;
              const n = set._count?.cards ?? 0;
              return (
                <Pressable
                  key={set.id}
                  onPress={() => setSelectedSetId(set.id)}
                  style={[styles.setRow, { borderBottomColor: qm.hair }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[styles.swatch, { backgroundColor: set.color ?? qm.setColors[1] }]} />
                  <Typography preset="qmRow" color={qm.ink} numberOfLines={1} style={styles.flex}>
                    {set.title}
                    <Typography preset="qmMeta" color={qm.muted}>
                      {' · '}{n === 0 ? t('ai:qm.cards.empty', 'No cards yet') : t('library:cards.cardCount', { count: n })}
                    </Typography>
                  </Typography>
                  <View style={[styles.radio, on ? { backgroundColor: qm.violet } : [styles.radioOff, { borderColor: qm.off }]]}>
                    {on && <CheckIcon size={14} color={qm.onViolet} strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

      </View>
    </QMSheet>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.s6 },
  previewWrap: { marginHorizontal: -spacing.xxl },
  previewRow: { gap: spacing.s10, paddingHorizontal: spacing.xxl },
  preview: { width: PREVIEW_W, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.md },
  previewOne: { width: '100%' },
  previewA: { marginTop: spacing.s6 },
  serif: { fontFamily: textPresets.qmVerse.fontFamily },
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  createRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  field: { flex: 1, minWidth: 0, height: FIELD_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, ...textPresets.qmInput, fontSize: textPresets.qmBodyMd.fontSize },
  create: { height: FIELD_H, paddingHorizontal: spacing.lg, borderRadius: radius.r12 + 2, alignItems: 'center', justifyContent: 'center' },
  loader: { marginVertical: spacing.lg },
  none: { paddingTop: spacing.s18, paddingBottom: spacing.s10, paddingHorizontal: spacing.sm },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: ROW_H, borderBottomWidth: StyleSheet.hairlineWidth },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2 },
  radio: { width: RADIO, height: RADIO, borderRadius: RADIO / 2, alignItems: 'center', justifyContent: 'center' },
  radioOff: { borderWidth: 2 },
  save: { height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
