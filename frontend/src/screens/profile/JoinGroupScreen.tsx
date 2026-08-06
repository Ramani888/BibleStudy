import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { getErrorMessage } from '../../api/client';
import { useJoinGroup } from '../../hooks/useGroups';

type Props = ProfileScreenProps<'JoinGroup'>;

export function JoinGroupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title="Join a Group" onClose={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label="Join Group" onPress={handleJoin} loading={joinGroup.isPending} />
        </View>
      }
      keyboardAvoiding
    >
      <View style={styles.content}>
        <Input
          label="Invite Code"
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          autoCapitalize="none"
          autoFocus
        />
      </View>
    </Screen>
  );
}

function makeStyles(_colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: { padding: layout.screenPaddingH, gap: spacing[4] },
    footer: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
  });
}
