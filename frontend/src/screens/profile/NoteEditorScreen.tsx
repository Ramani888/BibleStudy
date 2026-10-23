import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { NOTE_PREDEFINED_TAGS } from '../../types';
import { useNote, useSaveNote, useDeleteNote, useConfirmDialog } from '../../hooks';
import { QMButton, QMConfirmDialog, QMEmpty, QMSheet } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { InfoIcon, ShareUpIcon, TagIcon, TrashIcon } from '../../components/icons';
import { getErrorMessage } from '../../api/client';
import { loadFailed } from '../../utils/queryState';
import { qmFont, radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'NoteEditor'>;
type Status = 'draft' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 800;
const TOUCH = 42;
const DOT = 7;
const TITLE_MAX = 500;

/** Pulsing dot while saving; steady once saved. */
function StatusDot({ pulse, color }: { pulse: boolean; color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = pulse ? withRepeat(withSequence(withTiming(0.3, { duration: 500 }), withTiming(1, { duration: 500 })), -1) : withTiming(1);
  }, [o, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export function NoteEditorScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const routeId = route.params?.noteId;

  const noteQuery = useNote(routeId ?? '');
  const { data: existing, isLoading, refetch } = noteQuery;
  const isError = loadFailed(noteQuery); // offline with nothing cached → "did not load", not a blank screen
  // The note's id once it exists — a new note gets one on its first autosave. A ref, so a queued
  // save always sees the id the previous save just created.
  const idRef = useRef<string | undefined>(routeId);
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const { show, dialogProps } = useConfirmDialog();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>(routeId ? 'saved' : 'draft');
  const [topicsOpen, setTopicsOpen] = useState(false);
  const bodyRef = useRef<TextInput>(null);
  const initialized = useRef(!routeId);
  const lastSaved = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const discarded = useRef(false);
  const leaving = useRef(false);

  useEffect(() => {
    if (existing && !initialized.current) {
      initialized.current = true;
      setTitle(existing.title);
      setBody(existing.body);
      setTags(existing.tags ?? []);
      lastSaved.current = JSON.stringify([existing.title.trim(), existing.body.trim(), existing.tags ?? []]);
    }
  }, [existing]);

  const savable = title.trim().length > 0 && body.trim().length > 0;
  const snapshot = JSON.stringify([title.trim(), body.trim(), tags]);
  // Latest text for saves that run after a newer render (queued saves, Done, leaving the screen).
  const latest = useRef({ title, body, tags, snapshot, savable });
  latest.current = { title, body, tags, snapshot, savable };

  // Serialised: a second save waits for the first, so a new note is never created twice.
  const { mutateAsync } = saveNote;
  const save = useCallback(async (): Promise<void> => {
    while (inFlight.current) await inFlight.current;
    const cur = latest.current;
    if (discarded.current || !cur.savable || cur.snapshot === lastSaved.current) return;
    setStatus('saving');
    const run = (async () => {
      try {
        const note = await mutateAsync({ id: idRef.current, payload: { title: cur.title.trim(), body: cur.body.trim(), tags: cur.tags } });
        idRef.current = note.id;
        lastSaved.current = cur.snapshot;
        setStatus(latest.current.snapshot === cur.snapshot ? 'saved' : 'saving');
      } catch {
        setStatus('error');
      }
    })();
    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, [mutateAsync]);

  // Autosave a moment after typing stops.
  useEffect(() => {
    if (!initialized.current) return;
    if (!savable) { if (!idRef.current) setStatus('draft'); return; }
    if (snapshot === lastSaved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { save(); }, AUTOSAVE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [snapshot, savable, save]);

  // Every way out (Done, back, swipe) waits for the last words to save. If they can't be saved
  // (offline), ask before leaving — closing used to drop them silently.
  useEffect(() => navigation.addListener('beforeRemove', e => {
    if (timer.current) clearTimeout(timer.current);
    const unsaved = () => !discarded.current && latest.current.savable && latest.current.snapshot !== lastSaved.current;
    if (!unsaved()) return;
    e.preventDefault();
    if (leaving.current) return; // a second tap while the first is still saving
    leaving.current = true;
    save().then(() => {
      leaving.current = false;
      if (!unsaved()) { navigation.dispatch(e.data.action); return; }
      show({
        title: t('profile:qmNoteEditor.unsavedTitle'),
        message: t('profile:qmNoteEditor.unsavedText'),
        confirmLabel: t('profile:qmNoteEditor.leave'),
        cancelLabel: t('profile:qmNoteEditor.stay'),
        variant: 'danger',
        onConfirm: () => { discarded.current = true; navigation.dispatch(e.data.action); },
      });
    });
  }), [navigation, save, show, t]);

  const done = () => navigation.goBack();

  const askDelete = () => {
    const noteId = idRef.current;
    if (!noteId) { discarded.current = true; navigation.goBack(); return; }
    show({
      title: t('profile:qmNotes.deleteTitle'),
      message: t('profile:qmNotes.deleteText', { title: title.trim() || t('profile:qmNoteEditor.titlePh') }),
      confirmLabel: t('profile:qmNotes.delete'),
      cancelLabel: t('profile:qmNotes.keep'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          discarded.current = true;
          if (timer.current) clearTimeout(timer.current);
          await deleteNote.mutateAsync(noteId);
          Toast.show({ type: 'success', text1: t('profile:qmNotes.deleted') });
          navigation.goBack();
        } catch (e) {
          discarded.current = false;
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  };

  const share = () => {
    if (savable) Share.share({ message: `${title.trim()}\n\n${body.trim()}` }).catch(() => {});
  };

  if (routeId && !initialized.current) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: qm.bg, paddingTop: insets.top }]}>
        {isError
          ? <QMEmpty icon={InfoIcon} title={t('profile:qmNoteEditor.loadFailed')} action={{ label: t('profile:qmNoteEditor.tryAgain'), onPress: () => refetch() }} />
          : isLoading && <ActivityIndicator color={qm.violet} />}
      </View>
    );
  }

  const statusInk = status === 'saved' ? qm.leafText : status === 'error' ? qm.error : status === 'saving' ? qm.goldText : qm.muted;
  const statusText = t(`profile:qmNoteEditor.${status === 'error' ? 'failed' : status}`);

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.surface }]} behavior="padding">
      <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={status === 'error' ? () => save() : undefined}
          disabled={status !== 'error'}
          style={styles.status}
          accessibilityRole={status === 'error' ? 'button' : 'text'}
          accessibilityLiveRegion="polite"
        >
          <StatusDot pulse={status === 'saving'} color={statusInk} />
          <Typography preset="qmChip" color={statusInk} numberOfLines={2} style={styles.flex}>{statusText}</Typography>
        </Pressable>
        <Pressable onPress={() => setTopicsOpen(true)} hitSlop={2} style={({ pressed }) => [styles.icon, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('profile:qmNoteEditor.topicsA11y')}>
          <TagIcon size={20} color={tags.length ? qm.link : qm.ink} />
        </Pressable>
        <Pressable onPress={share} disabled={!savable} hitSlop={2} style={({ pressed }) => [styles.icon, (pressed || !savable) && styles.dim]} accessibilityRole="button" accessibilityLabel={t('profile:qmNoteEditor.share')}>
          <ShareUpIcon size={20} color={qm.ink} />
        </Pressable>
        <Pressable onPress={askDelete} hitSlop={2} style={({ pressed }) => [styles.icon, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('profile:qmNoteEditor.delete')}>
          <TrashIcon size={20} color={qm.muted} />
        </Pressable>
        <AnimatedPressable scaleTo={0.96} onPress={done} style={[styles.done, { backgroundColor: qm.violet }]} accessibilityRole="button">
          <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmNoteEditor.done')}</Typography>
        </AnimatedPressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('profile:qmNoteEditor.titlePh')}
          placeholderTextColor={qm.muted}
          maxLength={TITLE_MAX}
          multiline
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => bodyRef.current?.focus()}
          autoFocus={!routeId}
          style={[styles.title, { color: qm.ink }]}
          accessibilityLabel={t('profile:qmNoteEditor.titlePh')}
        />
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmChip" color={qm.goldText}>{tag}</Typography>
              </View>
            ))}
          </View>
        )}
        <TextInput
          ref={bodyRef}
          value={body}
          onChangeText={setBody}
          placeholder={t('profile:qmNoteEditor.bodyPh')}
          placeholderTextColor={qm.muted}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          style={[styles.body, { color: qm.body }]}
          accessibilityLabel={t('profile:qmNoteEditor.bodyPh')}
        />
      </ScrollView>

      <View style={[styles.foot, { borderTopColor: qm.hair, paddingBottom: insets.bottom + spacing.sm }]}>
        <Typography preset="qmFine" color={qm.muted}>{t('profile:qmNoteEditor.autosave')}</Typography>
      </View>

      <QMSheet visible={topicsOpen} onClose={() => setTopicsOpen(false)} title={t('profile:qmNoteEditor.topics')}>
        <View style={styles.topicGrid}>
          {NOTE_PREDEFINED_TAGS.map(tag => {
            const on = tags.includes(tag);
            return (
              <AnimatedPressable
                key={tag}
                scaleTo={0.96}
                onPress={() => setTags(prev => (on ? prev.filter(x => x !== tag) : [...prev, tag]))}
                style={[styles.topic, { backgroundColor: on ? qm.violet : qm.field }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Typography preset="qmLink" color={on ? qm.onViolet : qm.body}>{tag}</Typography>
              </AnimatedPressable>
            );
          })}
        </View>
        <QMButton label={t('profile:qmNoteEditor.done')} onPress={() => setTopicsOpen(false)} style={styles.topicDone} />
      </QMSheet>
      <QMConfirmDialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.5 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingLeft: spacing.xl, paddingRight: spacing.md },
  status: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s6 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  icon: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  done: { height: spacing.huge, paddingHorizontal: spacing.lg, marginLeft: spacing.xs, borderRadius: radius.pill, justifyContent: 'center' },
  content: { paddingHorizontal: spacing.s22, paddingTop: spacing.s14, paddingBottom: spacing.xl, flexGrow: 1 },
  title: { fontFamily: qmFont.serifMedium, fontSize: 26, lineHeight: 34, padding: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s6, marginTop: spacing.md },
  tag: { borderRadius: radius.pill, paddingVertical: spacing.s6, paddingHorizontal: spacing.s10 },
  body: { fontFamily: qmFont.regular, fontSize: 17, lineHeight: 28, marginTop: spacing.lg, padding: 0, minHeight: 300 },
  foot: { alignItems: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.s10, borderTopWidth: StyleSheet.hairlineWidth },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.s10 },
  topic: { height: spacing.huge, paddingHorizontal: spacing.s14, borderRadius: radius.pill, justifyContent: 'center' },
  topicDone: { marginTop: spacing.s18, marginHorizontal: spacing.s10 },
});
