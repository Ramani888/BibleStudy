import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, fontSizes, spacing } from '../../../theme';
import { Typography } from '../../../components/ui';

const SEND_ICON_SIZE = 20;
const CREDIT_ICON_SIZE = 12;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  creditBalance?: number;
}

export function ChatInput({ onSend, disabled, creditBalance }: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const msg = text.trim();
    setText('');
    onSend(msg);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing[2] }]}>
        {creditBalance !== undefined && (
          <View style={styles.creditRow}>
            <Icon
              name="star"
              size={CREDIT_ICON_SIZE}
              color={creditBalance > 0 ? colors.textSecondary : colors.error}
            />
            <Typography preset="caption" color={creditBalance > 0 ? colors.textSecondary : colors.error}>
              {creditBalance > 0
                ? `${creditBalance} credits remaining`
                : 'No credits — claim your daily credit first'}
            </Typography>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            placeholder="Ask a Bible question…"
            placeholderTextColor={colors.textDisabled}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
            editable={!disabled}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={8}
          >
            <Icon
              name="arrow-up"
              size={SEND_ICON_SIZE}
              color={canSend ? colors.textOnPrimary : colors.textDisabled}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 22,
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
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray200,
  },
});
