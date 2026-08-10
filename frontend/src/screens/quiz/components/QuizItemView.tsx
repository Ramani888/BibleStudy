import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Typography } from '../../../components/ui';
import { layout, spacing, useTheme } from '../../../theme';
import type { QuizItem } from '../../../types';

const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  item: QuizItem;
  initialResponse?: unknown;
  onResponseChange?: (r: unknown) => void;
  hasPrev: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  bottomInset?: number;
}

function getDefaultResponse(item: QuizItem): unknown {
  if (item.mode === 'blanks') return item.blankAt.map(() => '');
  if (item.mode === 'chunks') return [] as string[];
  if (item.mode === 'type_answer' || item.mode === 'type_verbatim') return '';
  return null;
}

export function QuizItemView({ item, initialResponse, onResponseChange, hasPrev, isLast, onPrev, onNext, onFinish, bottomInset = 0 }: Props) {
  const { colors } = useTheme();

  const [response, setResponseState] = useState<unknown>(() => initialResponse ?? getDefaultResponse(item));

  const setResponse = (r: unknown) => {
    setResponseState(r);
    onResponseChange?.(r);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Typography preset="caption" color={colors.textSecondary} style={styles.label}>{modeLabel(item)}</Typography>
          {!!promptText(item) && (
            <Typography preset="h3" color={colors.textPrimary}>{promptText(item)}</Typography>
          )}
        </View>

        <View style={styles.answerArea}>
          <Body item={item} response={response} onChangeResponse={setResponse} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(bottomInset, spacing.lg) }]}>
        <View style={styles.btnRow}>
          <Button label="← Prev" variant="outline" onPress={onPrev} disabled={!hasPrev} style={styles.flex} />
          <Button label={isLast ? 'Finish' : 'Next →'} onPress={isLast ? onFinish : onNext} style={styles.flex} />
        </View>
      </View>
    </View>
  );
}

function modeLabel(item: QuizItem): string {
  switch (item.mode) {
    case 'mc':            return 'QUESTION';
    case 'story_mc':      return 'MATCH THE VERSE';
    case 'type_answer':   return 'QUESTION';
    case 'type_verbatim': return 'TYPE THE PASSAGE';
    case 'blanks':        return 'FILL THE BLANKS';
    case 'chunks':        return 'PUT IN ORDER';
    case 'read':          return 'READ & MEMORIZE';
  }
}

function promptText(item: QuizItem): string {
  if (item.mode === 'blanks' || item.mode === 'chunks') return item.prompt ?? '';
  if (item.mode === 'read') return item.text;
  return item.prompt;
}

// ─── per-mode inputs ──────────────────────────────────────────────────────────

interface BodyProps {
  item: QuizItem;
  response: unknown;
  onChangeResponse: (r: unknown) => void;
}

function Body({ item, response, onChangeResponse }: BodyProps) {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return <MC item={item} response={response as number | null} onChangeResponse={onChangeResponse} />;
    case 'type_answer':
    case 'type_verbatim':
      return <TypeIn item={item} response={response as string} onChangeResponse={onChangeResponse} />;
    case 'blanks':
      return <Blanks item={item} response={response as string[]} onChangeResponse={onChangeResponse} />;
    case 'chunks':
      return <Chunks item={item} response={response as string[]} onChangeResponse={onChangeResponse} />;
    case 'read':
      return null;
  }
}

function MC({ item, response, onChangeResponse }: { item: any; response: number | null; onChangeResponse: (r: unknown) => void }) {
  const { colors } = useTheme();
  return (
    <>
      {item.options.map((opt: string, i: number) => (
        <Pressable
          key={i}
          onPress={() => onChangeResponse(i)}
          style={[
            styles.option,
            { borderColor: colors.border, backgroundColor: colors.surface },
            response === i && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
          ]}
        >
          <View style={[
            styles.letter,
            { backgroundColor: colors.surfaceMuted },
            response === i && { backgroundColor: colors.accent },
          ]}>
            <Typography preset="label" color={response === i ? colors.background : colors.textSecondary}>{LETTERS[i]}</Typography>
          </View>
          <Typography preset="body" color={colors.textPrimary} style={styles.flex}>{opt}</Typography>
        </Pressable>
      ))}
    </>
  );
}

function TypeIn({ item, response, onChangeResponse }: { item: any; response: string; onChangeResponse: (r: unknown) => void }) {
  const { colors } = useTheme();
  return (
    <TextInput
      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
      value={response}
      onChangeText={onChangeResponse}
      placeholder="Your answer…"
      placeholderTextColor={colors.textSecondary}
      multiline={item.mode === 'type_verbatim'}
      autoCapitalize="none"
    />
  );
}

function Blanks({ item, response, onChangeResponse }: { item: any; response: string[]; onChangeResponse: (r: unknown) => void }) {
  const { colors } = useTheme();
  const blankPos = new Map<number, number>(item.blankAt.map((t: number, k: number) => [t, k]));
  return (
    <View style={styles.blanksWrap}>
      {item.tokens.map((tok: string, i: number) => {
        if (blankPos.has(i)) {
          const k = blankPos.get(i)!;
          return (
            <TextInput
              key={i}
              style={[styles.blank, { borderColor: colors.accent, color: colors.textPrimary }]}
              value={response[k] ?? ''}
              onChangeText={t => { const n = [...response]; n[k] = t; onChangeResponse(n); }}
              autoCapitalize="none"
            />
          );
        }
        return <Typography key={i} preset="body" color={colors.textPrimary} style={styles.word}>{tok}</Typography>;
      })}
    </View>
  );
}

function Chunks({ item, response, onChangeResponse }: { item: any; response: string[]; onChangeResponse: (r: unknown) => void }) {
  const { colors } = useTheme();
  const chunkKey = (c: string, i: number) => `${i}::${c}`;
  const unkey = (k: string) => k.slice(k.indexOf('::') + 2);

  return (
    <>
      <View style={styles.chunkArea}>
        {response.map((k, i) => (
          <View key={i} style={[styles.chunkPicked, { backgroundColor: colors.accentSoft }]}>
            <Typography preset="body" color={colors.textPrimary}>{unkey(k)}</Typography>
          </View>
        ))}
      </View>
      <View style={{ height: spacing.md }} />
      <View style={styles.chunkArea}>
        {item.chunks.map((c: string, i: number) => {
          const key = chunkKey(c, i);
          if (response.includes(key)) return null;
          return (
            <Pressable key={key} onPress={() => onChangeResponse([...response, key])} style={[styles.chunk, { borderColor: colors.accent }]}>
              <Typography preset="body" color={colors.accent}>{c}</Typography>
            </Pressable>
          );
        })}
      </View>
      {response.length > 0 && (
        <Button label="Undo" variant="outline" onPress={() => onChangeResponse(response.slice(0, -1))} style={styles.undoBtn} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap:   { flex: 1 },
  flex:   { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  questionCard: {
    margin: layout.screenPaddingH,
    padding: spacing.xl,
    borderRadius: layout.cardRadiusLg,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  label:      { letterSpacing: 0.5 },
  answerArea: { paddingHorizontal: layout.screenPaddingH },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadiusSm,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  letter:          { width: 28, height: 28, borderRadius: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1.5,
    borderRadius: layout.cardRadius,
    padding: spacing.lg,
    minHeight: layout.inputHeight,
    textAlignVertical: 'top',
  },
  blanksWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  word:       { marginRight: spacing.xs },
  blank: {
    minWidth: 90,
    borderBottomWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s2,
    textAlign: 'center',
  },
  chunkArea:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, minHeight: 44 },
  chunk:       { borderWidth: 1.5, borderRadius: spacing.s10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chunkPicked: { borderRadius: spacing.s10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  undoBtn:     { marginTop: spacing.md },
  footer:      { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md, borderTopWidth: 1 },
  btnRow:      { flexDirection: 'row', gap: spacing.md },
});
