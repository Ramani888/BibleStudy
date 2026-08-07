import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components/ui';
import { layout, Theme, useTheme } from '../../../theme';

interface CardPreviewProps {
  question: string;
  answer: string;
}

export function CardPreview({ question, answer }: CardPreviewProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <View style={styles.preview}>
      <View style={styles.previewTop}>
        <Typography
          preset="body"
          color={question ? colors.textPrimary : colors.textDisabled}
          style={styles.previewText}
        >
          {question || 'Front (question)'}
        </Typography>
      </View>
      <View style={styles.previewBottom}>
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    preview: {
      borderRadius: layout.cardRadius,
      overflow: 'hidden',
    },
    previewTop: {
      backgroundColor: colors.backgroundCard,
      padding: spacing[4],
      minHeight: 72,
      justifyContent: 'center',
    },
    previewBottom: {
      backgroundColor: colors.background,
      padding: spacing[4],
      minHeight: 56,
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    previewText: { lineHeight: 22 },
  });
