import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SetCardSkeleton } from '../../components/feedback';
import { getErrorMessage } from '../../api/client';
import { useGroup, useUpdateGroup, useRegenerateInviteCode } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'EditGroup'>;

export function EditGroupScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { data: group, isLoading } = useGroup(groupId);
  const updateGroup = useUpdateGroup();
  const regenerateInvite = useRegenerateInviteCode();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? '');
    }
  }, [group]);

  const handleSave = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Group name is required' });
      return;
    }
    updateGroup.mutate(
      { id: groupId, payload: { name: name.trim(), description: description.trim() || undefined } },
      {
        onSuccess: () => { Toast.show({ type: 'success', text1: 'Group updated' }); navigation.goBack(); },
        onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
      }
    );
  };

  const handleRegenerate = () => {
    regenerateInvite.mutate(groupId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'New invite code generated' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  if (isLoading) return <SetCardSkeleton />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Input label="Group Name *" value={name} onChangeText={setName} />
            <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </View>

          {group && (
            <View style={styles.inviteSection}>
              <Typography preset="label">Current Invite Code</Typography>
              <Typography preset="body" color={colors.textSecondary}>{group.inviteCode}</Typography>
              <Button
                label="Regenerate Code"
                variant="outline"
                onPress={handleRegenerate}
                loading={regenerateInvite.isPending}
              />
            </View>
          )}

          <Button label="Save Changes" onPress={handleSave} loading={updateGroup.isPending} />
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
  inviteSection: { gap: spacing[2], padding: spacing[3], backgroundColor: colors.backgroundSecondary, borderRadius: 8 },
});
