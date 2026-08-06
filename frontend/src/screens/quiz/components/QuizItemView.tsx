import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Typography } from '../../../components/ui';
import { CheckCircleIcon, CloseCircleIcon } from '../../../components/icons';
import { normalize } from '../../../hooks/useQuizSession';
import { layout, spacing, useTheme } from '../../../theme';
import type { QuizItem } from '../../../types';

const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  item: QuizItem;
  submitted: boolean;
  lastCorrect: boolean | null;
  isLast: boolean;
  onSubmit: (response: unknown) => void;
  onNext: () => void;
}

export function QuizItemView({ item, submitted, lastCorrect, isLast, onSubmit, onNext }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Body item={item} submitted={submitted} onSubmit={onSubmit} />
      </ScrollView>

      {submitted && (
        <View style={styles.footer}>
          {lastCorrect !== null && (
            <View style={[styles.banner, lastCorrect ? styles.ok : styles.bad]}>
              {lastCorrect
                ? <CheckCircleIcon size={20} color={colors.success} />
                : <CloseCircleIcon size={20} color={colors.error} />
              }
              <Typography preset="label" color={lastCorrect ? colors.success : colors.error}>
                {lastCorrect ? 'Correct!' : correctText(item)}
              </Typography>
            </View>
          )}
          <View style={styles.nextBtn}>
            <Button label={isLast ? 'See Results' : 'Next'} onPress={onNext} fullWidth />
          </View>
        </View>
      )}
    </View>
  );
}

function correctText(item: QuizItem): string {
  if (item.mode === 'mc' || item.mode === 'story_mc') return `Answer: ${item.options[item.answerIndex]}`;
  if (item.mode === 'type_answer' || item.mode === 'type_verbatim') return `Answer: ${item.answer}`;
  if (item.mode === 'blanks') return `Answer: ${item.blankAt.map(i => item.tokens[i]).join(', ')}`;
  if (item.mode === 'chunks') return item.correct.join(' ');
  return '';
}

// ─── per-mode body ────────────────────────────────────────────────────────────
function Body({ item, submitted, onSubmit }: { item: QuizItem; submitted: boolean; onSubmit: (r: unknown) => void }) {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return <MC item={item} submitted={submitted} onSubmit={onSubmit} />;
    case 'type_answer':
    case 'type_verbatim':
      return <TypeIn item={item} submitted={submitted} onSubmit={onSubmit} />;
    case 'blanks':
      return <Blanks item={item} submitted={submitted} onSubmit={onSubmit} />;
    case 'chunks':
      return <Chunks item={item} submitted={submitted} onSubmit={onSubmit} />;
    case 'read':
      return <Read item={item} submitted={submitted} onSubmit={onSubmit} />;
  }
}

function Prompt({ label, text }: { label: string; text: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Typography preset="label" color={colors.textSecondary}>{label}</Typography>
      <View style={{ height: spacing[2] }} />
      {!!text && <Typography preset="h3" color={colors.textPrimary}>{text}</Typography>}
      <View style={{ height: spacing[5] }} />
    </>
  );
}

function MC({ item, submitted, onSubmit }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [sel, setSel] = useState<number | null>(null);

  const state = (i: number) => {
    if (!submitted) return 'idle';
    if (i === item.answerIndex) return 'correct';
    if (i === sel) return 'wrong';
    return 'faded';
  };

  return (
    <>
      <Prompt label={item.mode === 'story_mc' ? 'MATCH THE VERSE' : 'QUESTION'} text={item.prompt} />
      {item.options.map((opt: string, i: number) => {
        const st = state(i);
        return (
          <Pressable key={i} disabled={submitted} onPress={() => { setSel(i); onSubmit(i); }} style={[styles.option, OPT_STYLES[st](colors)]}>
            <View style={[styles.letter, LET_STYLES[st](colors)]}>
              <Typography preset="label" color={LETT_COLOR[st](colors)}>{LETTERS[i]}</Typography>
            </View>
            <Typography preset="body" color={st === 'faded' ? colors.textDisabled : colors.textPrimary} style={styles.flex}>{opt}</Typography>
          </Pressable>
        );
      })}
    </>
  );
}

function TypeIn({ item, submitted, onSubmit }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [val, setVal] = useState('');
  return (
    <>
      <Prompt label={item.mode === 'type_verbatim' ? 'TYPE THE PASSAGE' : 'QUESTION'} text={item.prompt || 'Type it from memory'} />
      <TextInput
        style={styles.input}
        value={val}
        onChangeText={setVal}
        editable={!submitted}
        placeholder="Your answer…"
        placeholderTextColor={colors.textSecondary}
        multiline={item.mode === 'type_verbatim'}
        autoCapitalize="none"
      />
      {!submitted && (
        <View style={styles.checkBtn}>
          <Button label="Check" onPress={() => onSubmit(val)} fullWidth />
        </View>
      )}
    </>
  );
}

function Blanks({ item, submitted, onSubmit }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [vals, setVals] = useState<string[]>(() => item.blankAt.map(() => ''));
  const blankPos = useMemo(() => new Map<number, number>(item.blankAt.map((t: number, k: number) => [t, k])), [item.blankAt]);
  return (
    <>
      <Prompt label={item.prompt ? item.prompt : 'FILL THE BLANKS'} text="" />
      <View style={styles.blanksWrap}>
        {item.tokens.map((tok: string, i: number) => {
          if (blankPos.has(i)) {
            const k = blankPos.get(i)!;
            const right = submitted && normalize(vals[k]) === normalize(tok.replace(/[^A-Za-z0-9']/g, ''));
            return (
              <TextInput
                key={i}
                style={[styles.blank, submitted && (right ? styles.blankOk : styles.blankBad)]}
                value={vals[k]}
                onChangeText={t => setVals(v => { const n = [...v]; n[k] = t; return n; })}
                editable={!submitted}
                autoCapitalize="none"
              />
            );
          }
          return <Typography key={i} preset="body" color={colors.textPrimary} style={styles.word}>{tok}</Typography>;
        })}
      </View>
      {!submitted && (
        <View style={styles.checkBtn}>
          <Button label="Check" onPress={() => onSubmit(vals)} fullWidth />
        </View>
      )}
    </>
  );
}

function Chunks({ item, submitted, onSubmit }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [order, setOrder] = useState<string[]>([]);
  const remaining = item.chunks.filter((c: string, i: number) => !order.includes(chunkKey(c, i)));
  return (
    <>
      <Prompt label={item.prompt ? `Rebuild: ${item.prompt}` : 'PUT IN ORDER'} text="" />
      <View style={styles.chunkArea}>
        {order.map((c, i) => <View key={i} style={styles.chunkPicked}><Typography preset="body" color={colors.textPrimary}>{unkey(c)}</Typography></View>)}
      </View>
      <View style={{ height: spacing[3] }} />
      <View style={styles.chunkArea}>
        {item.chunks.map((c: string, i: number) => {
          const key = chunkKey(c, i);
          if (order.includes(key)) return null;
          return (
            <Pressable key={key} disabled={submitted} onPress={() => setOrder(o => [...o, key])} style={styles.chunk}>
              <Typography preset="body" color={colors.primary}>{c}</Typography>
            </Pressable>
          );
        })}
      </View>
      {!submitted && (
        <View style={styles.btnRow}>
          <Button label="Undo" variant="outline" onPress={() => setOrder(o => o.slice(0, -1))} disabled={!order.length} style={styles.flex} />
          <Button label="Check" onPress={() => onSubmit(order.map(unkey))} disabled={remaining.length > 0} style={styles.flex} />
        </View>
      )}
    </>
  );
}

function Read({ item, submitted, onSubmit }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <>
      <Prompt label={item.prompt || 'READ & MEMORIZE'} text="" />
      <Typography preset="bodyLg" color={colors.textPrimary}>{item.text}</Typography>
      {!submitted && (
        <View style={styles.checkBtn}>
          <Button label="Got it" onPress={() => onSubmit(null)} fullWidth />
        </View>
      )}
    </>
  );
}

// chunk key helpers
const chunkKey = (c: string, i: number) => `${i}::${c}`;
const unkey = (k: string) => k.slice(k.indexOf('::') + 2);

// themed option state helpers
type St = 'idle' | 'correct' | 'wrong' | 'faded';
type Colors = ReturnType<typeof useTheme>['colors'];
const OPT_STYLES: Record<St, (c: Colors) => object> = {
  idle: c => ({ borderColor: c.border, backgroundColor: c.backgroundCard }),
  correct: c => ({ borderColor: c.success, backgroundColor: c.successSurface }),
  wrong: c => ({ borderColor: c.error, backgroundColor: c.errorSurface }),
  faded: c => ({ borderColor: c.border, backgroundColor: c.backgroundCard, opacity: 0.6 }),
};
const LET_STYLES: Record<St, (c: Colors) => object> = {
  idle: c => ({ backgroundColor: c.backgroundSecondary }),
  correct: c => ({ backgroundColor: c.success }),
  wrong: c => ({ backgroundColor: c.error }),
  faded: c => ({ backgroundColor: c.backgroundSecondary }),
};
const LETT_COLOR: Record<St, (c: Colors) => string> = {
  idle: c => c.textSecondary,
  correct: c => c.background,
  wrong: c => c.background,
  faded: c => c.textDisabled,
};

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: { flex: 1 },
    flex: { flex: 1 },
    scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[4] },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: 14,
      borderWidth: 1.5,
      marginBottom: spacing[3],
    },
    letter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      padding: spacing[4],
      minHeight: 52,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    blanksWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[1] },
    word: { marginRight: spacing[1] },
    blank: {
      minWidth: 90,
      borderBottomWidth: 2,
      borderColor: colors.primary,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    blankOk: { borderColor: colors.success, color: colors.success },
    blankBad: { borderColor: colors.error, color: colors.error },
    chunkArea: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], minHeight: 44 },
    chunk: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    chunkPicked: {
      backgroundColor: colors.primarySurface,
      borderRadius: 10,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    footer: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[4], paddingTop: spacing[2] },
    banner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: 12 },
    ok: { backgroundColor: colors.successSurface },
    bad: { backgroundColor: colors.errorSurface },
    nextBtn: { marginTop: spacing[3] },
    checkBtn: { marginTop: spacing[3] },
    btnRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[3] },
  });
}
