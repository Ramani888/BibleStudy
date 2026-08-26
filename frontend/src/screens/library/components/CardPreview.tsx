import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui';
import { CARD_FILL_LIGHT, fontSizes, layout, lineHeights, spacing, useTheme } from '../../../theme';

interface CardPreviewProps {
  question: string;
  answer: string;
}

export function CardPreview({ question, answer }: CardPreviewProps) {
  const { t } = useTranslation('library');
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const cardBg = isDark ? colors.chipIdle : CARD_FILL_LIGHT;
  return (
    <View style={styles.preview}>
      <View style={[styles.previewTop, { backgroundColor: cardBg }]}>
        <Typography
          preset="body"
          color={question ? colors.textPrimary : colors.textDisabled}
          style={styles.previewText}
        >
          {question || t('cards.cardPreviewFront')}
        </Typography>
      </View>
      <View style={[styles.previewBottom, { backgroundColor: cardBg, borderTopColor: colors.border }]}>
        <Typography
          preset="body"
          color={answer ? colors.textSecondary : colors.textDisabled}
          style={styles.previewText}
        >
          {answer || t('cards.cardPreviewBack')}
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
    minHeight: 72, // ponytail: off-grid Figma value, no s72 token
    justifyContent: 'center',
  },
  previewBottom: {
    padding: spacing.lg,
    minHeight: 56, // ponytail: off-grid Figma value, no s56 token
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  previewText: { lineHeight: fontSizes.md * lineHeights.normal },
});
