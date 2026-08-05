import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Spacer, Typography } from '../../../components/ui';
import { normalize } from '../../../hooks/useQuizSession';
import { colors, layout, spacing } from '../../../theme';
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
  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Body item={item} submitted={submitted} onSubmit={onSubmit} />
      </ScrollView>

      {submitted && (
        <View style={styles.footer}>
          {lastCorrect !== null && (
            <View style={[styles.banner, lastCorrect ? styles.ok : styles.bad]}>
              <Icon name={lastCorrect ? 'checkmark-circle' : 'close-circle'} size={20} color={lastCorrect ? colors.success : colors.error} />
              <Typography preset="label" color={lastCorrect ? colors.success : colors.error}>
                {lastCorrect ? 'Correct!' : correctText(item)}
              </Typography>
            </View>
          )}
          <Spacer size={spacing[3]} />
          <Button label={isLast ? 'See Results' : 'Next'} onPress={onNext} fullWidth />
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
  return (
    <>
      <Typography preset="label" color={colors.textSecondary}>{label}</Typography>
      <Spacer size={spacing[2]} />
      {!!text && <Typography preset="h3" color={colors.textPrimary}>{text}</Typography>}
      <Spacer size={spacing[5]} />
    </>
  );
}

function MC({ item, submitted, onSubmit }: any) {
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
          <Pressable key={i} disabled={submitted} onPress={() => { setSel(i); onSubmit(i); }} style={[styles.option, OPT[st]]}>
            <View style={[styles.letter, LET[st]]}><Typography preset="label" color={LETT[st]}>{LETTERS[i]}</Typography></View>
            <Typography preset="body" color={st === 'faded' ? colors.textDisabled : colors.textPrimary} style={styles.flex}>{opt}</Typography>
          </Pressable>
        );
      })}
    </>
  );
}

function TypeIn({ item, submitted, onSubmit }: any) {
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
      {!submitted && (<><Spacer size={spacing[3]} /><Button label="Check" onPress={() => onSubmit(val)} fullWidth /></>)}
    </>
  );
}

function Blanks({ item, submitted, onSubmit }: any) {
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
      {!submitted && (<><Spacer size={spacing[4]} /><Button label="Check" onPress={() => onSubmit(vals)} fullWidth /></>)}
    </>
  );
}

function Chunks({ item, submitted, onSubmit }: any) {
  const [order, setOrder] = useState<string[]>([]);
  const remaining = item.chunks.filter((c: string, i: number) => !order.includes(chunkKey(c, i)));
  return (
    <>
      <Prompt label={item.prompt ? `Rebuild: ${item.prompt}` : 'PUT IN ORDER'} text="" />
      <View style={styles.chunkArea}>
        {order.map((c, i) => <View key={i} style={styles.chunkPicked}><Typography preset="body">{unkey(c)}</Typography></View>)}
      </View>
      <Spacer size={spacing[3]} />
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
        <>
          <Spacer size={spacing[3]} />
          <View style={styles.btnRow}>
            <Button label="Undo" variant="outline" onPress={() => setOrder(o => o.slice(0, -1))} disabled={!order.length} style={styles.flex} />
            <Button label="Check" onPress={() => onSubmit(order.map(unkey))} disabled={remaining.length > 0} style={styles.flex} />
          </View>
        </>
      )}
    </>
  );
}

function Read({ item, submitted, onSubmit }: any) {
  return (
    <>
      <Prompt label={item.prompt || 'READ & MEMORIZE'} text="" />
      <Typography preset="bodyLg" color={colors.textPrimary}>{item.text}</Typography>
      {!submitted && (<><Spacer size={spacing[5]} /><Button label="Got it" onPress={() => onSubmit(null)} fullWidth /></>)}
    </>
  );
}

// chunk keys keep duplicates distinct
const chunkKey = (c: string, i: number) => `${i}::${c}`;
const unkey = (k: string) => k.slice(k.indexOf('::') + 2);

type St = 'idle' | 'correct' | 'wrong' | 'faded';
const OPT: Record<St, object> = {
  idle: { borderColor: colors.border, backgroundColor: colors.background },
  correct: { borderColor: colors.success, backgroundColor: colors.successSurface },
  wrong: { borderColor: colors.error, backgroundColor: colors.errorSurface },
  faded: { borderColor: colors.border, backgroundColor: colors.background, opacity: 0.6 },
};
const LET: Record<St, object> = {
  idle: { backgroundColor: colors.backgroundSecondary }, correct: { backgroundColor: colors.success },
  wrong: { backgroundColor: colors.error }, faded: { backgroundColor: colors.backgroundSecondary },
};
const LETT: Record<St, string> = { idle: colors.textSecondary, correct: colors.background, wrong: colors.background, faded: colors.textDisabled };

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[4] },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: 14, borderWidth: 1.5, marginBottom: spacing[3] },
  letter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.backgroundSecondary, padding: spacing[4], minHeight: 52, color: colors.textPrimary, textAlignVertical: 'top' },
  blanksWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[1] },
  word: { marginRight: spacing[1] },
  blank: { minWidth: 90, borderBottomWidth: 2, borderColor: colors.primary, paddingHorizontal: spacing[2], paddingVertical: 2, color: colors.textPrimary, textAlign: 'center' },
  blankOk: { borderColor: colors.success, color: colors.success },
  blankBad: { borderColor: colors.error, color: colors.error },
  chunkArea: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], minHeight: 44 },
  chunk: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  chunkPicked: { backgroundColor: colors.primarySurface, borderRadius: 10, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  footer: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[4], paddingTop: spacing[2] },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: 12 },
  ok: { backgroundColor: colors.successSurface },
  bad: { backgroundColor: colors.errorSurface },
  btnRow: { flexDirection: 'row', gap: spacing[3] },
});
