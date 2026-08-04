import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { useJoinGroup } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'JoinGroup'>;

export function JoinGroupScreen({ navigation }: Props) {
  const joinGroup = useJoinGroup();
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = () => {
    if (!inviteCode.trim()) {
      Toast.show({ type: 'error', text1: 'Enter an invite code' });
      return;
    }
    joinGroup.mutate(inviteCode.trim(), {
      onSuccess: (group) => {
        Toast.show({ type: 'success', text1: `Joined ${group.name}!` });
        navigation.replace('GroupDetail', { groupId: group.id });
      },
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.content}>
          <Typography preset="h3">Join a Group</Typography>
          <Typography preset="body" color={colors.textSecondary}>
            Ask a group admin for an invite code
          </Typography>
          <Input
            label="Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoCapitalize="none"
            autoFocus
          />
          <Button label="Join Group" onPress={handleJoin} loading={joinGroup.isPending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: layout.screenPaddingH, gap: spacing[4] },
});
