import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { NOTE_PREDEFINED_TAGS } from '../../types';
import { useNote, useCreateNote, useUpdateNote } from '../../hooks';
import { Typography } from '../../components/ui';
import { AppModal } from '../../components/feedback/Modal';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ShareIcon, TagIcon } from '../../components/icons';
import { getErrorMessage } from '../../api/client';
import { type Theme, fontSizes, fontWeights, layout, lineHeights, useTheme } from '../../theme';

type Props = ProfileScreenProps<'NoteEditor'>;

export function NoteEditorScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
    Keyboard.dismiss();
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
      // share cancelled
    }
  };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );

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
    <Screen
      edges={['top', 'bottom']}
      keyboardAvoiding
      header={
        <ScreenHeader
          title={isEdit ? 'Edit Note' : 'New Note'}
          handle
          right={
            <View style={styles.headerActions}>
              <Pressable onPress={() => setTagModalVisible(true)} hitSlop={8}>
                <TagIcon size={22} color={selectedTags.length > 0 ? colors.primary : colors.textSecondary} />
              </Pressable>
              <Pressable onPress={handleShare} disabled={!canShare} hitSlop={8}>
                <ShareIcon size={22} color={canShare ? colors.textSecondary : colors.textDisabled} />
              </Pressable>
              <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
                <Typography
                  preset="label"
                  color={canSave ? colors.primary : colors.textDisabled}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </Typography>
              </Pressable>
            </View>
          }
        />
      }
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor={colors.textSecondary}
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
          placeholderTextColor={colors.textSecondary}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>

      <AppModal visible={tagModalVisible} title="Add Tags" onClose={() => setTagModalVisible(false)} showHandle>
        <View style={styles.tagGrid}>
          {NOTE_PREDEFINED_TAGS.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Typography preset="caption" color={active ? colors.primary : colors.textSecondary}>
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
    </Screen>
  );
}

function makeStyles({ colors, spacing, layout }: Theme) {
  return StyleSheet.create({
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
    scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[6], flexGrow: 1 },
    titleInput: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.textPrimary,
      paddingVertical: spacing[2],
      marginBottom: spacing[2],
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing[4] },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] },
    tagPill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: layout.pillRadius,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    bodyInput: {
      fontSize: fontSizes.md,
      color: colors.textPrimary,
      lineHeight: fontSizes.md * lineHeights.relaxed,
      minHeight: 200,
      flexGrow: 1,
    },
tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
    tagChip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: layout.pillRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    tagChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    tagDoneBtn: {
      backgroundColor: colors.primary,
      borderRadius: layout.cardRadius,
      paddingVertical: spacing[3],
      alignItems: 'center',
      marginTop: spacing[2],
    },
  });
}
