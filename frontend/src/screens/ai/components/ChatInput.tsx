import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { fontSizes, layout, lineHeights, radius, spacing, useTheme, palette } from '../../../theme';
import { Typography } from '../../../components/ui';
import { StarIcon, ArrowUpIcon, FileTextIcon, PlusIcon, CloseIcon } from '../../../components/icons';

const SEND_ICON_SIZE = 18;
const CREDIT_ICON_SIZE = 12;
const MAX_LENGTH = 1000;
const WARN_THRESHOLD = 900;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  creditBalance?: number;
  attachmentName?: string | null;
  attachmentType?: 'IMAGE' | 'PDF';
  attachmentLocalUri?: string | null;
  isUploading?: boolean;
  onAttachPress?: () => void;
  onClearAttachment?: () => void;
  onUpgrade?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  creditBalance,
  attachmentName,
  attachmentType,
  attachmentLocalUri,
  isUploading,
  onAttachPress,
  onClearAttachment,
  onUpgrade,
}: ChatInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');

  const canSend     = text.trim().length > 0 && !disabled;
  const showCounter = text.length >= WARN_THRESHOLD;
  const actionCost  = attachmentType === 'PDF' ? 5 : attachmentType === 'IMAGE' ? 3 : 1;

  const handleSend = () => {
    if (!canSend) return;
    const msg = text.trim();
    setText('');
    onSend(msg);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>

      {/* State 6 — credits warning */}
      {creditBalance !== undefined && (
        <View style={styles.creditRow}>
          <StarIcon size={CREDIT_ICON_SIZE} color={creditBalance > 0 ? colors.textSecondary : colors.alert} />
          <Typography preset="caption" color={creditBalance > 0 ? colors.textSecondary : colors.alert}>
            {creditBalance > 0
              ? `Costs ${actionCost} credit${actionCost > 1 ? 's' : ''} · ${creditBalance} remaining`
              : 'No credits — claim your daily credit or'}
          </Typography>
          {creditBalance <= 0 && onUpgrade && (
            <Pressable onPress={onUpgrade} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <Typography preset="caption" color={colors.accent}> Upgrade</Typography>
            </Pressable>
          )}
        </View>
      )}

      {/* State 5 — attachment: image thumbnail or PDF chip */}
      {(isUploading || !!attachmentName) && (
        attachmentType === 'IMAGE' && attachmentLocalUri ? (
          // Image: thumbnail with spinner overlay while uploading, clear button after
          <View style={styles.thumbWrap}>
            <Image source={{ uri: attachmentLocalUri }} style={styles.thumb} resizeMode="cover" />
            {isUploading ? (
              <View style={styles.thumbOverlay}>
                <ActivityIndicator size="small" color={palette.white} />
              </View>
            ) : (
              <Pressable style={({ pressed }) => [styles.thumbClearBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={onClearAttachment} hitSlop={8}>
                <CloseIcon size={10} color={palette.white} />
              </Pressable>
            )}
          </View>
        ) : (
          // PDF (or unknown type during upload): text chip with spinner or file icon
          <View style={[styles.attachChip, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
            {isUploading
              ? <ActivityIndicator size="small" color={colors.accent} style={styles.chipSpinner} />
              : <FileTextIcon size={14} color={colors.accent} />
            }
            <Typography preset="caption" color={colors.accent} style={styles.attachName} numberOfLines={1}>
              {attachmentName ?? 'Uploading…'}
            </Typography>
            {!isUploading && (
              <Pressable onPress={onClearAttachment} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <CloseIcon size={14} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )
      )}

      {/* States 1–4 — single container, always */}
      <View style={[styles.inputBox, { backgroundColor: colors.surfaceMuted }]}>
        {/* Text input — grows from minHeight to maxHeight, then scrolls */}
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }, disabled && styles.inputDisabled]}
          placeholder="Ask a Bible question…"
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          scrollEnabled
          maxLength={MAX_LENGTH}
          returnKeyType="default"
          editable={!disabled}
          textAlignVertical="top"
        />

        {/* Counter — only near limit */}
        {showCounter && (
          <Typography preset="caption" color={colors.alert} style={styles.counter}>
            {text.length} / {MAX_LENGTH}
          </Typography>
        )}

        {/* Bottom row: [+] ··· [↑]  — pinned to bottom via flex-end on container */}
        <View style={styles.bottomRow}>
          {onAttachPress ? (
            <Pressable
              onPress={onAttachPress}
              disabled={disabled}
              hitSlop={12}
              style={({ pressed }) => [styles.attachIconBtn, disabled && styles.inputDisabled, { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              <PlusIcon size={22} color={colors.textSecondary} />
            </Pressable>
          ) : <View style={styles.attachPlaceholder} />}

          <Pressable
            style={({ pressed }) => [styles.sendBtn, { backgroundColor: colors.accent }, canSend ? styles.sendActive : styles.sendInactive, canSend && { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={8}
          >
            <ArrowUpIcon size={SEND_ICON_SIZE} color={colors.textOnAccent} />
          </Pressable>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  thumbWrap: {
    position: 'relative',
    width: 64 /* ponytail: off-grid Figma value */,
    height: 64,
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  thumb: {
    width: 64 /* ponytail: off-grid Figma value */,
    height: 64,
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbClearBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: spacing.s18,
    height: spacing.s18,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s6,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    borderWidth: 1,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s6,
  },
  attachName: { flexShrink: 1 },
  chipSpinner: { width: spacing.s14, height: spacing.s14 },

  // One box — filled, no hard border
  inputBox: {
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  input: {
    minHeight: spacing.xxl,
    maxHeight: 160 /* ponytail: off-grid Figma value */,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    padding: 0,
    margin: 0,
  },
  inputDisabled: { opacity: 0.5 },

  counter: {
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // [+] icon-only · spacer · [↑] circle  — bottom of the box
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  attachIconBtn: {
    padding: spacing.xs,
  },
  attachPlaceholder: {
    width: spacing.s30,
  },

  sendBtn: {
    marginLeft: 'auto',
    width: 34 /* ponytail: off-grid Figma value */,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive:   { opacity: 1 },
  sendInactive: { opacity: 0.3 },
});
