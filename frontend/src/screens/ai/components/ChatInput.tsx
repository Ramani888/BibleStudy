import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSizes, layout, spacing, useTheme, type Theme } from '../../../theme';
import { Typography } from '../../../components/ui';
import { StarIcon, ArrowUpIcon, FileTextIcon, PlusIcon, CloseIcon } from '../../../components/icons';

const SEND_ICON_SIZE = 20;
const CREDIT_ICON_SIZE = 12;
const ATTACH_ICON_SIZE = 20;
const MAX_LENGTH = 1000;
const WARN_THRESHOLD = 900;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  creditBalance?: number;
  attachmentName?: string | null;      // Phase F.1: currently attached PDF name
  onAttachPress?: () => void;
  onClearAttachment?: () => void;
  onUpgrade?: () => void;               // G3: shown when out of credits
}

export function ChatInput({ onSend, disabled, creditBalance, attachmentName, onAttachPress, onClearAttachment, onUpgrade }: ChatInputProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const canSend = text.trim().length > 0 && !disabled;
  const showCounter = text.length > 0;
  const counterColor = text.length >= WARN_THRESHOLD ? colors.error : colors.textDisabled;

  const handleSend = () => {
    if (!canSend) return;
    const msg = text.trim();
    setText('');
    onSend(msg);
  };

  const inputContent = (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing[2] }]}>
      {creditBalance !== undefined && (
        <View style={styles.creditRow}>
          <StarIcon
            size={CREDIT_ICON_SIZE}
            color={creditBalance > 0 ? colors.textSecondary : colors.error}
          />
          <Typography preset="caption" color={creditBalance > 0 ? colors.textSecondary : colors.error}>
            {creditBalance > 0
              ? `${creditBalance} credits remaining`
              : 'No credits — claim your daily credit or'}
          </Typography>
          {creditBalance <= 0 && onUpgrade && (
            <Pressable onPress={onUpgrade} hitSlop={8}>
              <Typography preset="caption" color={colors.primary}> Upgrade</Typography>
            </Pressable>
          )}
        </View>
      )}

      {attachmentName ? (
        <View style={styles.attachChip}>
          <FileTextIcon size={14} color={colors.primary} />
          <Typography preset="caption" color={colors.primary} style={styles.attachName} numberOfLines={1}>
            {attachmentName}
          </Typography>
          <Pressable onPress={onClearAttachment} hitSlop={8}>
            <CloseIcon size={14} color={colors.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        {onAttachPress && (
          <Pressable
            style={[styles.attachBtn, disabled && styles.inputDisabled]}
            onPress={onAttachPress}
            disabled={disabled}
            hitSlop={8}
          >
            <PlusIcon size={ATTACH_ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        )}
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder="Ask a Bible question…"
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={MAX_LENGTH}
          returnKeyType="default"
          editable={!disabled}
        />
        <Pressable
          style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          hitSlop={8}
        >
          <ArrowUpIcon
            size={SEND_ICON_SIZE}
            color={canSend ? colors.textOnPrimary : colors.textDisabled}
          />
        </Pressable>
      </View>

      {showCounter && (
        <Typography preset="caption" color={counterColor} style={styles.counter}>
          {text.length} / {MAX_LENGTH}
        </Typography>
      )}
    </View>
  );

  // Android uses adjustResize (set in AndroidManifest.xml) — the system already
  // shifts the layout up when the keyboard appears, so wrapping with
  // KeyboardAvoidingView would double-shift. iOS needs it for padding behavior.
  if (Platform.OS === 'android') {
    return inputContent;
  }

  return (
    <KeyboardAvoidingView behavior="padding">
      {inputContent}
    </KeyboardAvoidingView>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  attachName: { flexShrink: 1 },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray200,
  },
  counter: {
    textAlign: 'right',
  },
});
