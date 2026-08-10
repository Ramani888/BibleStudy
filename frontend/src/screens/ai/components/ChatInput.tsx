import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { fontSizes, layout, spacing, useTheme, palette } from '../../../theme';
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
              ? `${creditBalance} credits remaining`
              : 'No credits — claim your daily credit or'}
          </Typography>
          {creditBalance <= 0 && onUpgrade && (
            <Pressable onPress={onUpgrade} hitSlop={8}>
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
              <Pressable style={styles.thumbClearBtn} onPress={onClearAttachment} hitSlop={8}>
                <CloseIcon size={10} color={palette.white} />
              </Pressable>
            )}
          </View>
        ) : (
          // PDF (or unknown type during upload): text chip with spinner or file icon
          <View style={[styles.attachChip, { backgroundColor: colors.accentSoft }]}>
            {isUploading
              ? <ActivityIndicator size="small" color={colors.accent} style={styles.chipSpinner} />
              : <FileTextIcon size={14} color={colors.accent} />
            }
            <Typography preset="caption" color={colors.accent} style={styles.attachName} numberOfLines={1}>
              {attachmentName ?? 'Uploading…'}
            </Typography>
            {!isUploading && (
              <Pressable onPress={onClearAttachment} hitSlop={8}>
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
              style={[styles.attachIconBtn, disabled && styles.inputDisabled]}
            >
              <PlusIcon size={22} color={colors.textSecondary} />
            </Pressable>
          ) : <View style={styles.attachPlaceholder} />}

          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.accent }, canSend ? styles.sendActive : styles.sendInactive]}
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
    width: 64,
    height: 64,
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  thumb: {
    width: 64,
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
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
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
    borderColor: palette.indigo300,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s6,
  },
  attachName: { flexShrink: 1 },
  chipSpinner: { width: 14, height: 14 },

  // One box — filled, no hard border
  inputBox: {
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  input: {
    minHeight: 24,
    maxHeight: 160,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.45,
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
    width: 30,
  },

  sendBtn: {
    marginLeft: 'auto',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive:   { opacity: 1 },
  sendInactive: { opacity: 0.3 },
});
