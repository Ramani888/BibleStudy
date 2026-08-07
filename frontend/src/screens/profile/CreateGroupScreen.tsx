import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { getErrorMessage } from '../../api/client';
import { useCreateGroup } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'CreateGroup'>;

export function CreateGroupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title="New Group" onClose={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label="Create Group" onPress={handleCreate} loading={createGroup.isPending} />
        </View>
      }
      keyboardAvoiding
    >
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
                    preset="caption"
                    color={visibility === v ? colors.textOnPrimary : colors.textPrimary}
                  >
                    {v.charAt(0) + v.slice(1).toLowerCase()}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: { padding: layout.screenPaddingH, gap: spacing[4] },
    form: { gap: spacing[3] },
    visibilitySection: { gap: spacing[2] },
    chips: { flexDirection: 'row', gap: spacing[2] },
    chip: {
      flex: 1,
      paddingVertical: spacing[2],
      borderRadius: spacing[2],
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    footer: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
  });
}
