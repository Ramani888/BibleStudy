import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography } from '../../../components/ui';
import { ArrowUpIcon, CloseIcon, DocIcon, ImageIcon, InfoIcon, PlusIcon } from '../../../components/icons';
import { useTabBarSpace } from '../../../hooks';
import { useTheme, spacing, radius, textPresets } from '../../../theme';
import { wantsCards } from '../chatMarks';

const BTN = 40;
const THUMB = 28;
const MAX_LENGTH = 1000;
const WARN_THRESHOLD = 900;
const INPUT_MAX_H = 110;
const AURA = 2;

interface ChatInputProps {
  onSend: (text: string) => void;
  /** An answer is being written → violet outline, input says so. */
  working?: boolean;
  disabled?: boolean;
  creditBalance?: number;
  attachmentName?: string | null;
  attachmentType?: 'IMAGE' | 'PDF';
  attachmentLocalUri?: string | null;
  isUploading?: boolean;
  onAttachPress?: () => void;
  onClearAttachment?: () => void;
  onUpgrade?: () => void;
  onClaim?: () => void;
}

/** Quiet-morning composer: cost line, attachment chip, [+] field [↑]. */
export const ChatInput = React.memo(function ChatInput({
  onSend, working, disabled, creditBalance, attachmentName, attachmentType, attachmentLocalUri,
  isUploading, onAttachPress, onClearAttachment, onUpgrade, onClaim,
}: ChatInputProps) {
  const { t } = useTranslation('ai');
  const { qm } = useTheme();
  const tabSpace = useTabBarSpace();
  const [text, setText] = useState('');

  // attachmentType falls back to 'PDF' upstream even with nothing attached; only price
  // media when something is actually attached.
  const hasAttachment = !!isUploading || !!attachmentName;
  const cost = hasAttachment ? (attachmentType === 'PDF' ? 5 : 3) : wantsCards(text) ? 2 : 1;
  const outOfCredits = creditBalance !== undefined && creditBalance <= 0;
  const canSend = (text.trim().length > 0 || (!!attachmentName && !isUploading)) && !disabled && !outOfCredits && !isUploading;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    const msg = text.trim() || t('ai:qm.chat.fileQuestion', 'What are the main points of this file?');
    setText('');
    onSend(msg);
  }, [canSend, text, onSend, t]);

  return (
    <View style={[styles.wrap, { backgroundColor: qm.bg, paddingBottom: spacing.md + tabSpace }]}>
      {creditBalance !== undefined && !outOfCredits && (
        <Typography preset="qmFine" color={qm.muted} style={styles.cost}>
          {t('ai:qm.chat.costLine', { count: cost, balance: creditBalance, defaultValue: `Costs ${cost} ${cost === 1 ? 'credit' : 'credits'} · ${creditBalance} left` })}
        </Typography>
      )}
      {outOfCredits && (
        <View style={[styles.noCredits, { backgroundColor: qm.errorBg }]} accessibilityRole="alert">
          <InfoIcon size={18} color={qm.warm} strokeWidth={2} />
          <Typography preset="qmBody" color={qm.ink} style={styles.flex}>
            <Typography preset="qmLink" color={qm.ink}>{t('ai:qm.chat.noCredits', 'No credits left')}</Typography>
            {' — '}
            <Typography preset="qmLink" color={qm.link} onPress={onClaim} accessibilityRole="link">{t('ai:qm.chat.claimDaily', 'claim your daily credit')}</Typography>
            {t('ai:qm.chat.or', ' or ')}
            <Typography preset="qmLink" color={qm.link} onPress={onUpgrade} accessibilityRole="link">{t('ai:composer.upgrade', 'Upgrade')}</Typography>
          </Typography>
        </View>
      )}

      <View style={[styles.aura, { borderColor: working ? qm.violet : qm.bg }]}>
        <View style={[styles.box, { backgroundColor: qm.surface, boxShadow: qm.tabShadow }]}>
          {hasAttachment && (
            <Animated.View entering={FadeInUp.duration(320)} style={[styles.chip, { backgroundColor: qm.goldBg }]}>
              {attachmentType === 'IMAGE' && attachmentLocalUri
                ? <Image source={{ uri: attachmentLocalUri }} style={styles.thumb} resizeMode="cover" />
                : attachmentType === 'IMAGE'
                  ? <ImageIcon size={18} color={qm.goldText} strokeWidth={2} />
                  : <DocIcon size={18} color={qm.goldText} strokeWidth={2} />}
              <Typography preset="qmLink" color={qm.goldText} numberOfLines={1} style={styles.flex}>
                {isUploading ? t('ai:qm.chat.uploading', 'Uploading…') : attachmentName}
              </Typography>
              {isUploading
                ? <ActivityIndicator size="small" color={qm.goldText} />
                : (
                  <Pressable onPress={onClearAttachment} hitSlop={8} style={styles.chipX} accessibilityRole="button" accessibilityLabel={t('ai:qm.chat.removeFile', 'Remove attachment')}>
                    <CloseIcon size={14} color={qm.goldText} strokeWidth={2.4} />
                  </Pressable>
                )}
            </Animated.View>
          )}
          <View style={styles.row}>
            {onAttachPress && (
              <AnimatedPressable
                scaleTo={0.92}
                onPress={onAttachPress}
                disabled={disabled}
                style={[styles.round, { backgroundColor: qm.field }, disabled && styles.dim]}
                accessibilityRole="button"
                accessibilityLabel={t('ai:qm.chat.attachA11y', 'Attach a PDF or photo')}
              >
                <PlusIcon size={18} color={qm.ink} strokeWidth={2} />
              </AnimatedPressable>
            )}
            <TextInput
              style={[styles.input, { color: qm.ink }]}
              placeholder={working ? t('ai:qm.chat.writing', 'Writing an answer…') : t('ai:qm.chat.placeholder', 'Ask a question')}
              placeholderTextColor={qm.muted}
              accessibilityLabel={t('ai:qm.chat.placeholder', 'Ask a question')}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={MAX_LENGTH}
              textAlignVertical="center"
            />
            <AnimatedPressable
              scaleTo={0.92}
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.round, { backgroundColor: canSend ? qm.violet : qm.btnOff }]}
              accessibilityRole="button"
              accessibilityLabel={t('ai:qm.chat.send', 'Send')}
              accessibilityState={{ disabled: !canSend }}
            >
              <ArrowUpIcon size={18} color={canSend ? qm.onViolet : qm.btnOffInk} strokeWidth={2} />
            </AnimatedPressable>
          </View>
          {text.length >= WARN_THRESHOLD && (
            <Typography preset="qmFine" color={qm.error} style={styles.counter}>{text.length} / {MAX_LENGTH}</Typography>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
  wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  cost: { paddingHorizontal: spacing.sm, paddingBottom: spacing.s6 },
  noCredits: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10,
    marginHorizontal: spacing.s2, marginBottom: spacing.s10, paddingVertical: spacing.s10, paddingHorizontal: spacing.s14, borderRadius: radius.md,
  },
  aura: { borderRadius: radius.r28, borderWidth: AURA },
  box: { borderRadius: radius.r28 - AURA, padding: spacing.s6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
    margin: spacing.xs, marginBottom: spacing.s6, paddingVertical: spacing.sm, paddingHorizontal: spacing.s10, borderRadius: radius.r12 + 2,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.r6 },
  chipX: { width: spacing.s22, height: spacing.s22, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s6 },
  round: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minWidth: 0, minHeight: BTN, maxHeight: INPUT_MAX_H,
    paddingVertical: spacing.s10, paddingHorizontal: spacing.xs, ...textPresets.qmInput, fontSize: textPresets.qmBodyMd.fontSize,
  },
  counter: { textAlign: 'right', paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
});
