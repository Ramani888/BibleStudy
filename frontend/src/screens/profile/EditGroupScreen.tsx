import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { getErrorMessage } from '../../api/client';
import { useGroup, useUpdateGroup, useRegenerateInviteCode } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'EditGroup'>;

export function EditGroupScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { groupId } = route.params;
  const { data: group, isLoading, error, refetch } = useGroup(groupId);
  const updateGroup = useUpdateGroup();
  const regenerateInvite = useRegenerateInviteCode();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (group) { setName(group.name); setDescription(group.description ?? ''); }
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

  if (isLoading) return <LoadingOverlay visible />;
  if (error) return <ErrorState message="Could not load group" onRetry={refetch} />;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title="Edit Group" onClose={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label="Save Changes" onPress={handleSave} loading={updateGroup.isPending} />
        </View>
      }
      keyboardAvoiding
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Input label="Group Name *" value={name} onChangeText={setName} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        </View>
        {group && (
          <View style={styles.inviteSection}>
            <Typography preset="label">Current Invite Code</Typography>
            <Typography preset="label" color={colors.textSecondary}>{group.inviteCode}</Typography>
            <Button
              label="Regenerate Code"
              variant="outline"
              onPress={handleRegenerate}
              loading={regenerateInvite.isPending}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: { padding: layout.screenPaddingH, gap: spacing[4] },
    form: { gap: spacing[3] },
    inviteSection: {
      gap: spacing[2],
      padding: spacing[3],
      backgroundColor: colors.backgroundSecondary,
      borderRadius: spacing[2],
    },
    footer: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
  });
}
