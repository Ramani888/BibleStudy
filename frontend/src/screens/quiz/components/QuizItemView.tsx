import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn, FadeInRight, SlideInDown, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import { QMButton } from '../../../components/qm';
import { AnimatedPressable, Typography } from '../../../components/ui';
import { CheckIcon, CloseIcon, LeafIcon } from '../../../components/icons';
import { qmFont, radius, spacing, textPresets, useTheme } from '../../../theme';
import type { QuizItem } from '../../../types';
import { normalize } from '../../../hooks/useQuizSession';
import { qmModeName } from '../quizUi';

const LETTERS = ['A', 'B', 'C', 'D'];
const OPT_MIN_H = 60;
const BADGE = 30;
const SLOT_MIN_W = 86;
const SLOT_H = 36;
const TILE_H = 44;
const POOL_MIN_H = 52;
const PLACED_MIN_H = 120;
const DOT = 8;
const USED_OPACITY = 0.35;
const DIM_OPACITY = 0.55;
const HIDDEN_BLUR = 18;
const HIDDEN_OPACITY = 0.35;
const NO_OFFSET = { width: 0, height: 0 };

// mirrors the private helpers in useQuizSession — not worth exporting for two callers
// MUST stay byte-identical to core() in useQuizSession (blank tiles vs grading).
// Keep any-script letters/numbers + apostrophe so non-Latin blanks aren't emptied.
const coreWord = (w: string) => w.replace(/[^\p{L}\p{N}']/gu, '');
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
  /** Muted source line in the chip row (set / quiz name). */
  setName?: string;
  /** Practice round that isn't recorded (e.g. practise-missed). */
  ephemeral?: boolean;
  /** Real cards feed SM-2: a miss reschedules for tomorrow — say so. */
  comesBack?: boolean;
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

export function QuizItemView({
  item, initialResponse, onResponseChange, onSubmit,
  submitted, lastCorrect, correctAnswer,
  isLast, onNext, onFinish, bottomInset = 0,
  setName, ephemeral, comesBack,
}: Props) {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();

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
  const big = isMC || item.mode === 'type_answer' || item.mode === 'type_verbatim';
  const goOn = isLast ? onFinish : onNext;

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[styles.scroll, submitted && scored && styles.scrollUnderSheet]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInRight.duration(320)}>
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: qm.lilac }]}>
              <Typography preset="qmLabel" color={qm.lilacInk}>{qmModeName(item.mode, t)}</Typography>
            </View>
            {scored && !!item.difficulty && (
              <View style={styles.diff}>
                <View style={[styles.dot, { backgroundColor: item.difficulty === 'EASY' ? qm.leaf : item.difficulty === 'HARD' ? qm.warm : qm.gold }]} />
                <Typography preset="qmMeta" color={qm.muted}>
                  {t(`quiz:difficulty.${item.difficulty.toLowerCase()}`, item.difficulty.charAt(0) + item.difficulty.slice(1).toLowerCase())}
                </Typography>
              </View>
            )}
            {(!scored || ephemeral) && (
              <View style={[styles.chip, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmLabel" color={qm.goldText}>
                  {!scored ? t('quiz:qm.notScored', 'Practice · not scored') : t('quiz:inQuiz.practiceNotSaved', 'Practice · not saved')}
                </Typography>
              </View>
            )}
            {!!setName && <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.setName}>{setName}</Typography>}
          </View>
          {!!item.prompt && (
            <Typography preset={big ? 'qmPrompt' : 'qmPromptSm'} color={qm.ink} style={styles.prompt}>{item.prompt}</Typography>
          )}
        </Animated.View>

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
      </ScrollView>

      {/* Check (non-MC scored) · Continue (read) */}
      {!submitted && (scored ? !isMC : true) && (
        <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, spacing.lg) + spacing.md }]}>
          {scored
            ? <QMButton label={t('quiz:qm.check', 'Check')} onPress={() => onSubmit(response)} off={!canCheck} />
            : <QMButton label={t('common:actions.continue', 'Continue')} onPress={goOn} off={!allRevealed} />}
        </View>
      )}

      {/* Feedback sheet — after submit for scored modes */}
      {submitted && scored && (
        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(160)}
          style={[styles.sheet, { backgroundColor: isCorrect ? qm.okSheet : qm.noSheet, boxShadow: qm.sheetShadow, paddingBottom: Math.max(bottomInset, spacing.lg) + spacing.lg }]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.sheetHead}>
            <Animated.View entering={ZoomIn.delay(120).springify().damping(10)}>
              {isCorrect
                ? <LeafIcon size={24} color={qm.okInk} filled />
                : <View style={[styles.noBadge, { backgroundColor: qm.noInk }]}><CloseIcon size={14} color={qm.noSheet} strokeWidth={3} /></View>}
            </Animated.View>
            <Typography preset="qmSheetTitle" color={isCorrect ? qm.okInk : qm.noInk}>
              {isCorrect ? t('quiz:qm.correctTitle', 'Correct') : t('quiz:qm.notQuite', 'Not quite')}
            </Typography>
          </View>
          {!isCorrect && (
            <>
              <View style={[styles.ghost, { backgroundColor: qm.ghost }]}>
                <Typography preset="qmLabel" color={qm.muted}>{t('quiz:qm.correctAnswer', 'Correct answer')}</Typography>
                <Typography preset="qmPromptSm" color={qm.ink} style={styles.ghostText}>{correctAnswer}</Typography>
              </View>
              {comesBack && (
                <Typography preset="qmBody" color={qm.body} style={styles.comesBack}>
                  {t('quiz:qm.comesBack', 'This card comes back tomorrow so it sticks.')}
                </Typography>
              )}
            </>
          )}
          <QMButton label={t('common:actions.continue', 'Continue')} onPress={goOn} style={styles.sheetBtn} />
        </Animated.View>
      )}
    </View>
  );
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
      return <TypeIn item={item} response={response as string} onChangeResponse={onChangeResponse} submitted={submitted} lastCorrect={lastCorrect} />;
    case 'blanks':
      return <WordBank item={item} onChangeResponse={onChangeResponse} submitted={submitted} />;
    case 'chunks':
      return <Chunks item={item} response={response as string[]} onChangeResponse={onChangeResponse} submitted={submitted} />;
    case 'read':
      return <TapToReveal item={item} onAllRevealed={onAllRevealed} />;
  }
}

// ─── MC ───────────────────────────────────────────────────────────────────────

type MCItem = Extract<QuizItem, { mode: 'mc' | 'story_mc' }>;

function MC({ item, response, onChangeResponse, submitted, lastCorrect, correctAnswer, onSubmit }: {
  item: MCItem; response: number | null; onChangeResponse: (r: unknown) => void;
  submitted: boolean; lastCorrect: boolean | null; correctAnswer: string;
  onSubmit: (r: unknown) => void;
}) {
  const correctIndex = item.options.indexOf(correctAnswer);
  return (
    <View style={styles.options} accessibilityRole="radiogroup">
      {item.options.map((opt, i) => (
        <Option
          key={i}
          letter={LETTERS[i]}
          text={opt}
          serif={item.mode === 'story_mc'}
          state={!submitted ? 'idle' : i === correctIndex ? 'right' : response === i && lastCorrect === false ? 'wrong' : 'dim'}
          onPress={() => {
            if (submitted) return;
            onChangeResponse(i);
            onSubmit(i);
          }}
        />
      ))}
    </View>
  );
}

function Option({ letter, text, serif, state, onPress }: {
  letter: string; text: string; serif: boolean; state: 'idle' | 'right' | 'wrong' | 'dim'; onPress: () => void;
}) {
  const { qm } = useTheme();
  // Right answer pops, a wrong pick nudges sideways (canvas okpop / nudge).
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  useEffect(() => {
    if (state === 'right') scale.value = withSequence(withTiming(1.03, { duration: 160 }), withSpring(1, { damping: 10 }));
    if (state === 'wrong') x.value = withSequence(withTiming(-4, { duration: 90 }), withTiming(4, { duration: 90 }), withTiming(0, { duration: 90 }));
  }, [state, scale, x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: x.value }] }));

  const ring = state === 'right' ? `inset 0px 0px 0px 2px ${qm.leaf}` : state === 'wrong' ? `inset 0px 0px 0px 2px ${qm.warm}` : qm.optLine;
  const bg = state === 'right' ? qm.leafBg : state === 'wrong' ? qm.errorBg : qm.surface;
  const badgeBg = state === 'right' ? qm.leaf : state === 'wrong' ? qm.warm : qm.field;
  const badgeInk = state === 'right' || state === 'wrong' ? qm.onViolet : qm.muted;
  return (
    <Animated.View style={[anim, state === 'dim' && styles.dim]}>
      <AnimatedPressable
        scaleTo={0.98}
        disabled={state !== 'idle'}
        onPress={onPress}
        style={[styles.option, { backgroundColor: bg, boxShadow: ring }]}
        accessibilityRole="radio"
        accessibilityState={{ checked: state === 'right' || state === 'wrong' }}
        accessibilityLabel={text}
      >
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          {state === 'right'
            ? <CheckIcon size={16} color={badgeInk} strokeWidth={3} />
            : <Typography preset="qmButton" color={badgeInk}>{letter}</Typography>}
        </View>
        <Typography preset={serif ? 'qmOptionSerif' : 'qmOption'} color={qm.ink} style={styles.flex}>{text}</Typography>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─── Type in ─────────────────────────────────────────────────────────────────

function TypeIn({ item, response, onChangeResponse, submitted, lastCorrect }: {
  item: Extract<QuizItem, { mode: 'type_answer' | 'type_verbatim' }>; response: string;
  onChangeResponse: (r: unknown) => void; submitted: boolean; lastCorrect: boolean | null;
}) {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  const [focused, setFocused] = useState(false);
  const verbatim = item.mode === 'type_verbatim';
  const ring = submitted
    ? `inset 0px 0px 0px 2px ${lastCorrect ? qm.leaf : qm.warm}`
    : focused ? `inset 0px 0px 0px 2px ${qm.violet}` : qm.optLine;
  return (
    <View>
      <Typography preset="qmFieldLabel" color={qm.body}>{t('quiz:qm.yourAnswer', 'Your answer')}</Typography>
      <TextInput
        style={[styles.input, verbatim ? styles.inputVerbatim : styles.inputShort, { backgroundColor: qm.surface, boxShadow: ring, color: qm.ink }]}
        value={response}
        onChangeText={onChangeResponse}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={verbatim ? t('quiz:qm.typeVerbatimHint', 'Type the whole passage') : t('quiz:qm.typeHint', 'Type your answer')}
        placeholderTextColor={qm.muted}
        multiline
        autoCapitalize="sentences"
        autoCorrect={false}
        editable={!submitted}
      />
      <Typography preset="qmMeta" color={qm.muted} style={styles.help}>
        {t('quiz:qm.typeRules', 'Capitals, punctuation and accents don’t matter. Spelling does.')}
      </Typography>
    </View>
  );
}

// ─── Word Bank (blanks) ───────────────────────────────────────────────────────

type Tile = { id: number; word: string };

function WordBank({ item, onChangeResponse, submitted }: {
  item: Extract<QuizItem, { mode: 'blanks' }>; onChangeResponse: (r: unknown) => void; submitted: boolean;
}) {
  const { t } = useTranslation('quiz');
  const { qm } = useTheme();

  // Generate shuffled tiles once per item — each blank gets a tile with a stable id
  const tiles = useMemo<Tile[]>(() =>
    shuffled(item.blankAt.map((tokenIdx, k) => ({ id: k, word: coreWord(item.tokens[tokenIdx]) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // placed[k] = tile id occupying blank k, or null
  const [placed, setPlaced] = useState<(number | null)[]>(() => item.blankAt.map(() => null));

  const commit = (next: (number | null)[]) => {
    setPlaced(next);
    onChangeResponse(next.map(id => id !== null ? tiles.find(x => x.id === id)!.word : ''));
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
  const blankPos = new Map<number, number>(item.blankAt.map((tokenIdx, k) => [tokenIdx, k]));

  return (
    <View>
      <View style={styles.verse}>
        {item.tokens.map((tok, i) => {
          if (!blankPos.has(i)) return <Typography key={i} preset="qmBlanks" color={qm.ink}>{tok}</Typography>;
          const k = blankPos.get(i)!;
          const word = placed[k] !== null ? tiles.find(x => x.id === placed[k])!.word : null;
          // Same rule as gradeItem: normalised word vs the token it replaced.
          const right = !!word && normalize(word) === normalize(coreWord(item.tokens[i]));
          const bg = !word ? qm.surface : submitted ? (right ? qm.leafBg : qm.errorBg) : qm.lilac;
          return (
            <Pressable
              key={i}
              onPress={() => removeFromBlank(k)}
              style={[styles.slot, { backgroundColor: bg }, !word && { borderBottomWidth: 2, borderBottomColor: qm.blank }]}
              accessibilityRole="button"
              accessibilityLabel={word ? t('quiz:qm.slotFilled', { word, defaultValue: `${word}, tap to empty` }) : t('quiz:qm.slotEmpty', 'Empty gap')}
            >
              <Typography preset="qmBlankWord" color={qm.ink}>{word ?? ''}</Typography>
            </Pressable>
          );
        })}
      </View>
      {!submitted && (
        <>
          <Typography preset="qmMeta" color={qm.muted} style={styles.blanksHelp}>
            {t('quiz:qm.blanksHelp', 'Tap a word to fill the next gap. Tap a gap to empty it.')}
          </Typography>
          <View style={styles.tiles}>
            {tiles.map(tile => {
              const used = usedIds.has(tile.id);
              return (
                <View key={tile.id} style={used && styles.used}>
                  <AnimatedPressable
                    scaleTo={0.95}
                    disabled={used}
                    onPress={() => placeTile(tile.id)}
                    style={[styles.tile, { backgroundColor: qm.surface, boxShadow: qm.optLine }]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: used }}
                  >
                    <Typography preset="qmTile" color={qm.ink}>{tile.word}</Typography>
                  </AnimatedPressable>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

function Chunks({ item, response, onChangeResponse, submitted }: {
  item: Extract<QuizItem, { mode: 'chunks' }>; response: string[]; onChangeResponse: (r: unknown) => void; submitted: boolean;
}) {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  const chunkKey = (c: string, i: number) => `${i}::${c}`;
  const unkey = (k: string) => k.slice(k.indexOf('::') + 2);

  return (
    <View>
      <View style={[styles.placed, response.length === 0 && styles.placedNone, { backgroundColor: qm.field }]} accessibilityLiveRegion="polite">
        {response.length === 0 && (
          <Typography preset="qmBody" color={qm.muted} align="center" style={styles.placedEmpty}>
            {t('quiz:qm.chunksHelp', 'Tap the pieces in the right order')}
          </Typography>
        )}
        {response.map((k, i) => (
          <Animated.View key={k} entering={FadeIn.duration(220)} style={[styles.piece, { backgroundColor: qm.surface, boxShadow: qm.optLine }]}>
            <Typography preset="qmLabel" color={qm.link}>{i + 1}</Typography>
            <Typography preset="qmTile" color={qm.ink} style={styles.flex}>{unkey(k)}</Typography>
          </Animated.View>
        ))}
      </View>
      <View style={styles.pool}>
        {item.chunks.map((c, i) => {
          const key = chunkKey(c, i);
          if (response.includes(key)) return null;
          return (
            <AnimatedPressable
              key={key}
              scaleTo={0.97}
              disabled={submitted}
              onPress={() => onChangeResponse([...response, key])}
              style={[styles.poolItem, { backgroundColor: qm.surface, boxShadow: qm.optLine }]}
              accessibilityRole="button"
            >
              <Typography preset="qmTile" color={qm.ink}>{c}</Typography>
            </AnimatedPressable>
          );
        })}
      </View>
      {response.length > 0 && !submitted && (
        <Pressable onPress={() => onChangeResponse(response.slice(0, -1))} hitSlop={8} style={styles.undo} accessibilityRole="button">
          <Typography preset="qmLink" color={qm.link}>{t('quiz:qm.undoLast', 'Undo last')}</Typography>
        </Pressable>
      )}
    </View>
  );
}

// ─── Tap to Reveal (read mode) ────────────────────────────────────────────────

function TapToReveal({ item, onAllRevealed }: { item: Extract<QuizItem, { mode: 'read' }>; onAllRevealed: () => void }) {
  const { t } = useTranslation('quiz');
  const { qm } = useTheme();
  const phrases = useMemo(() => splitPhrases(item.text), [item.text]);
  const [revealed, setRevealed] = useState(0);

  const tapNext = () => {
    const next = revealed + 1;
    setRevealed(next);
    if (next >= phrases.length) onAllRevealed();
  };
  const done = revealed >= phrases.length;

  return (
    <View>
      <Pressable
        onPress={done ? undefined : tapNext}
        accessibilityRole="button"
        accessibilityLabel={t('quiz:qm.revealNext', 'Reveal the next line')}
      >
        <LinearGradient colors={qm.verse as unknown as string[]} locations={[0, 0.6, 1]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.verseCard}>
          {phrases.map((phrase, i) => (
            <Typography
              key={i}
              preset="qmRead"
              // Hidden lines: transparent text + blurred shadow (RN has no CSS blur filter).
              style={i < revealed
                ? { color: qm.verseInk }
                : { color: 'transparent', textShadowColor: qm.verseInk, textShadowRadius: HIDDEN_BLUR, textShadowOffset: NO_OFFSET, opacity: HIDDEN_OPACITY }}
            >
              {phrase}
            </Typography>
          ))}
        </LinearGradient>
      </Pressable>
      <View style={[styles.revealPill, { backgroundColor: qm.lilac }]}>
        <Typography preset="qmLabel" color={qm.lilacInk}>
          {done
            ? t('quiz:qm.allShown', { count: phrases.length, defaultValue: `All ${phrases.length} lines shown` })
            : t('quiz:qm.tapReveal', { revealed, total: phrases.length, defaultValue: `Tap to reveal · ${revealed} of ${phrases.length}` })}
        </Typography>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap:   { flex: 1 },
  flex:   { flex: 1, minWidth: 0 },
  dim:    { opacity: DIM_OPACITY },
  used:   { opacity: USED_OPACITY },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  scrollUnderSheet: { paddingBottom: spacing.s80 * 3 }, // room to scroll answers clear of the feedback sheet
  chips:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  chip:   { paddingVertical: spacing.s5, paddingHorizontal: spacing.s10 + 1, borderRadius: radius.pill },
  diff:   { flexDirection: 'row', alignItems: 'center', gap: spacing.s5 },
  dot:    { width: DOT, height: DOT, borderRadius: DOT / 2 },
  setName: { flexShrink: 1 },
  prompt: { marginTop: spacing.xl },
  answerArea: { marginTop: spacing.s22 },
  options: { gap: spacing.s10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: OPT_MIN_H,
    paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r18,
  },
  badge: { width: BADGE, height: BADGE, borderRadius: BADGE / 2, alignItems: 'center', justifyContent: 'center' },
  input: {
    marginTop: spacing.sm, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.md,
    ...textPresets.qmAnswer, textAlignVertical: 'top',
  },
  inputShort: { minHeight: spacing.s80 },
  inputVerbatim: { minHeight: spacing.s80 * 2, fontFamily: qmFont.serif },
  help: { marginTop: spacing.sm },
  blanksHelp: { marginTop: spacing.lg },
  verse: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.s5, rowGap: spacing.s10 },
  slot: {
    minWidth: SLOT_MIN_W, height: SLOT_H, paddingHorizontal: spacing.s10, borderRadius: radius.r10,
    alignItems: 'center', justifyContent: 'center',
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tile: { height: TILE_H, paddingHorizontal: spacing.lg, borderRadius: radius.r12, justifyContent: 'center' },
  placed: { minHeight: PLACED_MIN_H, padding: spacing.md, borderRadius: radius.r18, gap: spacing.sm },
  placedNone: { justifyContent: 'center' },
  placedEmpty: { alignSelf: 'center' },
  piece: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
    paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2,
  },
  pool: { gap: spacing.sm, marginTop: spacing.s14 },
  poolItem: { minHeight: POOL_MIN_H, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, justifyContent: 'center' },
  undo: { alignSelf: 'flex-start', marginTop: spacing.s10, paddingVertical: spacing.s10, paddingHorizontal: spacing.s14 },
  verseCard: { padding: spacing.xl, borderRadius: radius.r21 + 1 },
  revealPill: { alignSelf: 'center', marginTop: spacing.s14, paddingVertical: spacing.sm, paddingHorizontal: spacing.s14, borderRadius: radius.pill },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: spacing.s22, paddingHorizontal: spacing.xl, borderTopLeftRadius: radius.r28, borderTopRightRadius: radius.r28,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  noBadge: { width: spacing.s22, height: spacing.s22, borderRadius: spacing.s22 / 2, alignItems: 'center', justifyContent: 'center' },
  ghost: { marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2 },
  ghostText: { marginTop: spacing.xs },
  comesBack: { marginTop: spacing.s10 },
  sheetBtn: { marginTop: spacing.lg },
});
