import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components/ui';
import { layout, spacing, useTheme } from '../../../theme';

interface CardPreviewProps {
  question: string;
  answer: string;
}

export function CardPreview({ question, answer }: CardPreviewProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.preview}>
      <View style={[styles.previewTop, { backgroundColor: colors.surface }]}>
        <Typography
          preset="body"
          color={question ? colors.textPrimary : colors.textDisabled}
          style={styles.previewText}
        >
          {question || 'Front (question)'}
        </Typography>
      </View>
      <View style={[styles.previewBottom, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Typography
          preset="body"
          color={answer ? colors.textSecondary : colors.textDisabled}
          style={styles.previewText}
        >
          {answer || 'Back (answer)'}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: layout.cardRadius,
    overflow: 'hidden',
  },
  previewTop: {
    padding: spacing.lg,
    minHeight: 72,
    justifyContent: 'center',
  },
  previewBottom: {
    padding: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  previewText: { lineHeight: 22 },
});
