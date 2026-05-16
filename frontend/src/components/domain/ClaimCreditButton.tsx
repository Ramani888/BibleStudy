import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { Typography } from '../ui';
import { useClaimDailyLogin } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, spacing } from '../../theme';

const CLAIM_ICON_SIZE = 16;

interface ClaimCreditButtonProps {
  onSuccess?: (data: { balance: number; transaction: { amount: number } }) => void;
}

export function ClaimCreditButton({ onSuccess }: ClaimCreditButtonProps) {
  const { mutate, isPending } = useClaimDailyLogin();

  const handleClaim = () => {
    mutate(undefined, {
      onSuccess: data => {
        Toast.show({
          type: 'success',
          text1: `+${data.transaction.amount} credit claimed!`,
        });
        onSuccess?.(data);
      },
      onError: err => {
        Toast.show({
          type: 'error',
          text1: 'Already claimed today',
          text2: getErrorMessage(err),
        });
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.claimBtn, { opacity: pressed || isPending ? 0.65 : 1 }]}
      onPress={handleClaim}
      disabled={isPending}
    >
      <View style={styles.claimBtnContent}>
        {!isPending && <Icon name="star-outline" size={CLAIM_ICON_SIZE} color={colors.primary} />}
        <Typography preset="label" color={colors.primary}>
          {isPending ? 'Claiming…' : 'Claim daily credit'}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  claimBtn: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
  },
  claimBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});
