import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../api/client';
import { useCreateGroup } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const createGroup = useCreateGroup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC' | 'FRIENDS'>('PRIVATE');

  const handleCreate = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Group name is required' });
      return;
    }
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined, visibility },
      {
        onSuccess: (group) => {
          Toast.show({ type: 'success', text1: 'Group created!' });
          navigation.replace('GroupDetail', { groupId: group.id });
        },
        onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Input label="Group Name *" value={name} onChangeText={setName} placeholder="Morning Prayer Group" />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="What is this group about?"
              multiline
              numberOfLines={3}
            />
            <View style={styles.visibilitySection}>
              <Typography preset="label">Visibility</Typography>
              <View style={styles.chips}>
                {(['PRIVATE', 'PUBLIC', 'FRIENDS'] as const).map(v => (
                  <Pressable
                    key={v}
                    style={[styles.chip, visibility === v && styles.chipActive]}
                    onPress={() => setVisibility(v)}
                  >
                    <Typography
                      preset="bodySm"
                      color={visibility === v ? colors.textOnPrimary : colors.textPrimary}
                    >
                      {v.charAt(0) + v.slice(1).toLowerCase()}
                    </Typography>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Button label="Create Group" onPress={handleCreate} loading={createGroup.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: layout.screenPaddingH, gap: spacing[4] },
  form: { gap: spacing[3] },
  visibilitySection: { gap: spacing[2] },
  chips: { flexDirection: 'row', gap: spacing[2] },
  chip: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
