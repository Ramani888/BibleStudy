import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { NOTE_PREDEFINED_TAGS } from '../../types';
import { useNote, useCreateNote, useUpdateNote } from '../../hooks';
import { Typography } from '../../components/ui/Typography';
import { AppModal } from '../../components/feedback/Modal';
import { ErrorState } from '../../components/feedback/ErrorState';
import { getErrorMessage } from '../../api/client';
import { colors, layout, spacing } from '../../theme';

type Props = ProfileScreenProps<'NoteEditor'>;

export function NoteEditorScreen({ navigation, route }: Props) {
  const noteId = route.params?.noteId;
  const isEdit = !!noteId;

  const { data: existing, isLoading, isFetching, error: loadError, refetch } = useNote(noteId ?? '');
  const createNote = useCreateNote();
  const updateNote = useUpdateNote(noteId ?? '');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const bodyRef = useRef<TextInput>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (existing && !initialized.current) {
      initialized.current = true;
      setTitle(existing.title);
      setBody(existing.body);
      setSelectedTags(existing.tags ?? []);
    }
  }, [existing]);

  const isSaving = createNote.isPending || updateNote.isPending;
  const canSave = title.trim().length > 0 && body.trim().length > 0 && !isSaving;
  const canShare = title.trim().length > 0 && body.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      if (isEdit) {
        await updateNote.mutateAsync({ title: title.trim(), body: body.trim(), tags: selectedTags });
        Toast.show({ type: 'success', text1: 'Note updated' });
      } else {
        await createNote.mutateAsync({ title: title.trim(), body: body.trim(), tags: selectedTags });
        Toast.show({ type: 'success', text1: 'Note saved' });
      }
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  const handleShare = async () => {
    if (!canShare) return;
    try {
      await Share.share({ message: `${title.trim()}\n\n${body.trim()}` });
    } catch {
      // share cancelled or unavailable — no user-facing action needed
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Note' : 'New Note',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setTagModalVisible(true)} hitSlop={8}>
            <Icon
              name="pricetags-outline"
              size={22}
              color={selectedTags.length > 0 ? colors.primary : colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={handleShare} disabled={!canShare} hitSlop={8}>
            <Icon
              name="share-social-outline"
              size={22}
              color={canShare ? colors.textSecondary : colors.textDisabled}
            />
          </Pressable>
          <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Typography
                preset="label"
                color={canSave ? colors.primary : colors.textDisabled}
              >
                Save
              </Typography>
            )}
          </Pressable>
        </View>
      ),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, isSaving, canSave, canShare, selectedTags]);

  if (isEdit && (isLoading || (isFetching && !initialized.current))) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isEdit && loadError) {
    return <ErrorState message="Could not load note" onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            onSubmitEditing={() => bodyRef.current?.focus()}
            maxLength={500}
            autoFocus={!isEdit}
          />
          <View style={styles.divider} />

          {selectedTags.length > 0 && (
            <View style={styles.tagRow}>
              {selectedTags.map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Typography preset="caption" color={colors.primary}>{tag}</Typography>
                </View>
              ))}
            </View>
          )}

          <TextInput
            ref={bodyRef}
            style={styles.bodyInput}
            placeholder="Write your note here…"
            placeholderTextColor={colors.textDisabled}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <AppModal
        visible={tagModalVisible}
        title="Add Tags"
        onClose={() => setTagModalVisible(false)}
        showHandle
      >
        <View style={styles.tagGrid}>
          {NOTE_PREDEFINED_TAGS.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Typography
                  preset="caption"
                  color={active ? colors.primary : colors.textSecondary}
                >
                  {tag}
                </Typography>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.tagDoneBtn} onPress={() => setTagModalVisible(false)}>
          <Typography preset="label" color={colors.textOnPrimary}>Done</Typography>
        </Pressable>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },

  scroll: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing[12],
    flexGrow: 1,
  },

  titleInput: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing[4],
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tagPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  bodyInput: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    minHeight: 200,
    flexGrow: 1,
  },

  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tagChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  tagChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tagDoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing[3],
    alignItems: 'center',
    marginTop: spacing[2],
  },
});
