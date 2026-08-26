import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Typography } from '../../../components/ui';
import { layout, spacing, useTheme, CARD_FILL_LIGHT, radius } from '../../../theme';
import type { QuizItem } from '../../../types';

const LETTERS = ['A', 'B', 'C', 'D'];

// mirrors the private helpers in useQuizSession — not worth exporting for two callers
const coreWord = (w: string) => w.replace(/[^A-Za-z0-9']/g, '');
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function splitPhrases(text: string): string[] {
  const parts = text.match(/[^,.;:!?]+[,.;:!?]*\s*/g);
  if (parts && parts.length > 1) return parts.map(s => s.trim()).filter(Boolean);
  // fallback: every 5 words
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 5) chunks.push(words.slice(i, i + 5).join(' '));
  return chunks;
}

interface Props {
  item: QuizItem;
  initialResponse?: unknown;
  onResponseChange?: (r: unknown) => void;
  onSubmit: (response: unknown) => void;
  submitted: boolean;
  lastCorrect: boolean | null;
  correctAnswer: string;
  isLast: boolean;
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

function getCanCheck(item: QuizItem, response: unknown): boolean {
  switch (item.mode) {
    case 'type_answer':
    case 'type_verbatim': return String(response ?? '').trim().length > 0;
    case 'blanks':        return (response as string[]).every((b: string) => b.trim().length > 0);
    case 'chunks':        return (response as string[]).length === item.correct.length;
    default:              return true;
  }
}

import { useTranslation } from 'react-i18next';

export function QuizItemView({
  item, initialResponse, onResponseChange, onSubmit,
  submitted, lastCorrect, correctAnswer,
  isLast, onNext, onFinish, bottomInset = 0,
}: Props) {
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';

  const [response, setResponseState] = useState<unknown>(() => initialResponse ?? getDefaultResponse(item));
  // Read mode: CONTINUE locked until all phrases tapped
  const [allRevealed, setAllRevealed] = useState(item.mode !== 'read');

  const setResponse = useCallback((r: unknown) => {
    setResponseState(r);
    onResponseChange?.(r);
  }, [onResponseChange]);

  const scored = item.mode !== 'read';
  const isMC = item.mode === 'mc' || item.mode === 'story_mc';
  const isCorrect = lastCorrect === true;
  const canCheck = !submitted && scored && !isMC && getCanCheck(item, response);

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Question card */}
        <View style={[styles.questionCard, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }]}>
          <Typography preset="caption" color={colors.textSecondary} style={styles.label}>{modeLabel(item)}</Typography>
          {!!promptText(item) && (
            <Typography preset="h3" color={colors.textPrimary}>{promptText(item)}</Typography>
          )}
        </View>

        {/* Answer input area */}
        <View style={styles.answerArea}>
          <Body
            item={item}
            response={response}
            onChangeResponse={setResponse}
            submitted={submitted}
            lastCorrect={lastCorrect}
            correctAnswer={correctAnswer}
            onSubmit={onSubmit}
            onAllRevealed={() => setAllRevealed(true)}
          />
        </View>

        {/* Feedback banner — shown after submit for scored modes */}
        {submitted && scored && (
          <View style={[styles.feedbackBanner, { backgroundColor: isCorrect ? colors.successSoft : colors.errorSurface }]}>
            <Typography preset="label" color={isCorrect ? colors.success : colors.difficultyHard} style={styles.feedbackTitle}>
              {isCorrect ? `✓  ${t('quiz:inQuiz.correct')}` : `✗  ${t('quiz:inQuiz.incorrect')}`}
            </Typography>
            {!isCorrect && (
              <View style={styles.correctAnswerWrap}>
                <Typography preset="caption" color={colors.textSecondary}>{t('quiz:inQuiz.correctAnswer')}</Typography>
                <Typography preset="body" color={colors.textPrimary} style={styles.correctAnswerText}>{correctAnswer}</Typography>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider, paddingBottom: Math.max(bottomInset, spacing.lg) }]}>
        {/* Non-MC scored, not yet submitted → full-width CHECK ANSWER */}
        {!submitted && scored && !isMC && (
          <Button
            label={t('common:actions.submit', 'CHECK ANSWER')}
            onPress={() => onSubmit(response)}
            disabled={!canCheck}
            style={styles.fullWidth}
          />
        )}

        {/* MC not submitted → nothing (tap an option to auto-submit) */}

        {/* After submit, or read mode → full-width CONTINUE / FINISH */}
        {(submitted || !scored) && (
          <Button
            label={isLast ? t('common:actions.done', 'FINISH') : t('common:actions.continue', 'CONTINUE')}
            onPress={isLast ? onFinish : onNext}
            disabled={!allRevealed}
            style={styles.fullWidth}
          />
        )}
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
    case 'read':          return 'TAP TO REVEAL';
  }
}

function promptText(item: QuizItem): string {
  if (item.mode === 'blanks' || item.mode === 'chunks') return item.prompt ?? '';
  if (item.mode === 'read') return item.prompt ?? '';
  return item.prompt;
}

// ─── per-mode inputs ──────────────────────────────────────────────────────────

interface BodyProps {
  item: QuizItem;
  response: unknown;
  onChangeResponse: (r: unknown) => void;
  submitted: boolean;
  lastCorrect: boolean | null;
  correctAnswer: string;
  onSubmit: (r: unknown) => void;
  onAllRevealed: () => void;
}

function Body({ item, response, onChangeResponse, submitted, lastCorrect, correctAnswer, onSubmit, onAllRevealed }: BodyProps) {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return <MC item={item} response={response as number | null} onChangeResponse={onChangeResponse} submitted={submitted} lastCorrect={lastCorrect} correctAnswer={correctAnswer} onSubmit={onSubmit} />;
    case 'type_answer':
    case 'type_verbatim':
      return <TypeIn item={item} response={response as string} onChangeResponse={onChangeResponse} submitted={submitted} />;
    case 'blanks':
      return <WordBank item={item} onChangeResponse={onChangeResponse} submitted={submitted} />;
    case 'chunks':
      return <Chunks item={item} response={response as string[]} onChangeResponse={onChangeResponse} submitted={submitted} />;
    case 'read':
      return <TapToReveal item={item} onAllRevealed={onAllRevealed} />;
  }
}

// ─── MC ───────────────────────────────────────────────────────────────────────

function MC({ item, response, onChangeResponse, submitted, lastCorrect, correctAnswer, onSubmit }: {
  item: any; response: number | null; onChangeResponse: (r: unknown) => void;
  submitted: boolean; lastCorrect: boolean | null; correctAnswer: string;
  onSubmit: (r: unknown) => void;
}) {
  const { colors } = useTheme();
  const correctIndex = item.options.indexOf(correctAnswer);

  return (
    <>
      {item.options.map((opt: string, i: number) => {
        const isSelected = response === i;
        const isThisCorrect = submitted && i === correctIndex;
        const isThisWrong = submitted && isSelected && lastCorrect === false;

        return (
          <Pressable
            key={i}
            onPress={() => {
              if (submitted) return;
              onChangeResponse(i);
              onSubmit(i);
            }}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, backgroundColor: colors.surface },
              isSelected && !submitted && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
              isThisCorrect && { borderColor: colors.success, backgroundColor: colors.successSoft },
              isThisWrong && { borderColor: colors.difficultyHard, backgroundColor: colors.errorSurface },
              pressed && !submitted && styles.optionPressed,
            ]}
          >
            <View style={[
              styles.letter,
              { backgroundColor: colors.surfaceMuted },
              isSelected && !submitted && { backgroundColor: colors.accent },
              isThisCorrect && { backgroundColor: colors.success },
              isThisWrong && { backgroundColor: colors.difficultyHard },
            ]}>
              <Typography
                preset="label"
                color={(isSelected && !submitted) || isThisCorrect || isThisWrong ? colors.background : colors.textSecondary}
              >
                {LETTERS[i]}
              </Typography>
            </View>
            <Typography preset="body" color={colors.textPrimary} style={styles.flex}>{opt}</Typography>
          </Pressable>
        );
      })}
    </>
  );
}

// ─── Type in ─────────────────────────────────────────────────────────────────

function TypeIn({ item, response, onChangeResponse, submitted }: { item: any; response: string; onChangeResponse: (r: unknown) => void; submitted: boolean }) {
  const { t } = useTranslation(['quiz', 'common']);
  const { colors } = useTheme();
  return (
    <TextInput
      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
      value={response}
      onChangeText={onChangeResponse}
      placeholder={t('quiz:summary.yourAnswer', 'Your answer…')}
      placeholderTextColor={colors.textSecondary}
      multiline={item.mode === 'type_verbatim'}
      autoCapitalize="none"
      editable={!submitted}
    />
  );
}

// ─── Word Bank (replaces TextInput blanks) ────────────────────────────────────

type Tile = { id: number; word: string };

function WordBank({ item, onChangeResponse, submitted }: { item: any; onChangeResponse: (r: unknown) => void; submitted: boolean }) {
  const { colors } = useTheme();

  // Generate shuffled tiles once per item — each blank gets a tile with a stable id
  const tiles = useMemo<Tile[]>(() =>
    shuffled(item.blankAt.map((tokenIdx: number, k: number) => ({ id: k, word: coreWord(item.tokens[tokenIdx]) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // placed[k] = tile id occupying blank k, or null
  const [placed, setPlaced] = useState<(number | null)[]>(() => item.blankAt.map(() => null));

  const commit = (next: (number | null)[]) => {
    setPlaced(next);
    onChangeResponse(next.map(id => id !== null ? tiles.find(t => t.id === id)!.word : ''));
  };

  const placeTile = (tileId: number) => {
    if (submitted) return;
    const nextEmpty = placed.findIndex(p => p === null);
    if (nextEmpty === -1) return;
    const next = [...placed];
    next[nextEmpty] = tileId;
    commit(next);
  };

  const removeFromBlank = (k: number) => {
    if (submitted || placed[k] === null) return;
    const next = [...placed];
    next[k] = null;
    commit(next);
  };

  const usedIds = new Set(placed.filter(id => id !== null));
  const available = tiles.filter(t => !usedIds.has(t.id));

  // Build display: tokens with placed-word chips or empty tap targets for blanks
  const blankPos = new Map<number, number>(item.blankAt.map((tokenIdx: number, k: number) => [tokenIdx, k]));

  return (
    <View style={styles.wordBankWrap}>
      {/* Verse with blank slots */}
      <View style={styles.blanksWrap}>
        {item.tokens.map((tok: string, i: number) => {
          if (blankPos.has(i)) {
            const k = blankPos.get(i)!;
            const filledWord = placed[k] !== null ? tiles.find(t => t.id === placed[k])!.word : null;
            return (
              <Pressable
                key={i}
                onPress={() => removeFromBlank(k)}
                style={[
                  styles.blankSlot,
                  { borderColor: filledWord ? colors.accent : colors.border, backgroundColor: filledWord ? colors.accentSoft : 'transparent' },
                ]}
              >
                <Typography
                  preset="body"
                  color={filledWord ? colors.accent : colors.textDisabled}
                  style={styles.blankSlotText}
                >
                  {filledWord ?? '___'}
                </Typography>
              </Pressable>
            );
          }
          return <Typography key={i} preset="body" color={colors.textPrimary} style={styles.word}>{tok}</Typography>;
        })}
      </View>

      {/* Available word tiles */}
      {!submitted && (
        <View style={styles.tileArea}>
          {available.map(tile => (
            <Pressable
              key={tile.id}
              onPress={() => placeTile(tile.id)}
              style={({ pressed }) => [
                styles.tile,
                { borderColor: colors.accent, backgroundColor: colors.surface },
                pressed && styles.tilePressed,
              ]}
            >
              <Typography preset="body" color={colors.accent}>{tile.word}</Typography>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

function Chunks({ item, response, onChangeResponse, submitted }: { item: any; response: string[]; onChangeResponse: (r: unknown) => void; submitted: boolean }) {
  const { t } = useTranslation(['quiz', 'common']);
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
      <View style={styles.spacer} />
      <View style={styles.chunkArea}>
        {item.chunks.map((c: string, i: number) => {
          const key = chunkKey(c, i);
          if (response.includes(key)) return null;
          return (
            <Pressable
              key={key}
              onPress={() => !submitted && onChangeResponse([...response, key])}
              style={({ pressed }) => [styles.chunk, { borderColor: colors.accent }, pressed && !submitted && styles.chunkPressed]}
            >
              <Typography preset="body" color={colors.accent}>{c}</Typography>
            </Pressable>
          );
        })}
      </View>
      {response.length > 0 && !submitted && (
        <Button label={t('common:actions.undo', 'Undo')} variant="outline" onPress={() => onChangeResponse(response.slice(0, -1))} style={styles.undoBtn} />
      )}
    </>
  );
}

// ─── Tap to Reveal (read mode) ────────────────────────────────────────────────

function TapToReveal({ item, onAllRevealed }: { item: any; onAllRevealed: () => void }) {
  const { t } = useTranslation('quiz');
  const { colors } = useTheme();
  const phrases = useMemo(() => splitPhrases(item.text), [item.text]);
  const [revealed, setRevealed] = useState(0);

  const tapNext = () => {
    const next = revealed + 1;
    setRevealed(next);
    if (next >= phrases.length) onAllRevealed();
  };

  return (
    <Pressable onPress={revealed < phrases.length ? tapNext : undefined} style={styles.tapRevealWrap}>
      <View style={styles.blanksWrap}>
        {phrases.map((phrase, i) => (
          <Typography
            key={i}
            preset="body"
            color={i < revealed ? colors.textPrimary : colors.textDisabled}
            style={[styles.phrase, i < revealed && styles.phraseRevealed]}
          >
            {phrase}
          </Typography>
        ))}
      </View>
      {revealed < phrases.length && (
        <View style={[styles.tapHint, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
          <Typography preset="caption" color={colors.textSecondary}>
            {t('quiz:play.tapToRevealProgress', { revealed, total: phrases.length, defaultValue: `Tap to reveal (${revealed}/${phrases.length})` })}
          </Typography>
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    minHeight: 100, // ponytail: off-grid, no spacing token for 100
    justifyContent: 'center',
  },
  label:      { letterSpacing: 0.5 },
  answerArea: { paddingHorizontal: layout.screenPaddingH },
  // Feedback
  feedbackBanner: {
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.lg,
    borderRadius: layout.cardRadius,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  feedbackTitle:     { fontWeight: '700' },
  correctAnswerWrap: { gap: spacing.xs, marginTop: spacing.xs },
  correctAnswerText: { fontWeight: '600' },
  // Footer
  footer:    { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md, borderTopWidth: 1 },
  fullWidth: { width: '100%' },
  // MC options
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadiusSm,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  letter:        { width: spacing.s28, height: spacing.s28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  optionPressed: { opacity: 0.7 },
  // Type input
  input: {
    borderWidth: 1.5,
    borderRadius: layout.cardRadius,
    padding: spacing.lg,
    minHeight: layout.inputHeight,
    textAlignVertical: 'top',
  },
  // Word bank (blanks)
  wordBankWrap: { gap: spacing.lg },
  blanksWrap:   { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  word:         { marginRight: spacing.xs },
  blankSlot: {
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s2,
    minWidth: 60, // ponytail: off-grid, no spacing token for 60
  },
  blankSlotText: { textAlign: 'center' },
  tileArea: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tile:      { borderWidth: 1.5, borderRadius: radius.r10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tilePressed: { opacity: 0.7 },
  // Chunks
  chunkArea:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, minHeight: 44 }, // ponytail: minHeight 44 — no spacing token
  chunk:        { borderWidth: 1.5, borderRadius: radius.r10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chunkPressed: { opacity: 0.7 },
  chunkPicked:  { borderRadius: radius.r10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  spacer:       { height: spacing.md },
  undoBtn:      { marginTop: spacing.md },
  // Tap to reveal
  tapRevealWrap: { gap: spacing.lg },
  phrase:        { marginRight: spacing.xs },
  phraseRevealed: { opacity: 1 },
  tapHint: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.r10,
    borderWidth: 1,
  },
});
