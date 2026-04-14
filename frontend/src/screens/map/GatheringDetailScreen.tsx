import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import type { MapScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useGathering, useRsvp, useCancelGathering, useLeaveGathering } from '../../hooks/useGatherings';
import { useAuthStore } from '../../store/auth.store';

type Props = MapScreenProps<'GatheringDetail'>;

const STATUS_LABELS = { GOING: 'Going', MAYBE: 'Maybe', NOT_GOING: "Can't Go" } as const;

export function GatheringDetailScreen({ route, navigation }: Props) {
  const { gatheringId } = route.params;
  const { user } = useAuthStore();
  const { data: gathering, isLoading, isFetching, error, refetch } = useGathering(gatheringId);
  const rsvp = useRsvp();
  const cancelGathering = useCancelGathering();
  const leaveGathering = useLeaveGathering();

  const myRsvp = gathering?.participants?.find(p => p.userId === user?.id);
  const isHost = gathering?.hostId === user?.id;

  const handleRsvp = (status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
    rsvp.mutate({ id: gatheringId, status });
  };

  const handleCancel = () => {
    Alert.alert('Cancel Gathering', 'This will cancel the gathering for all participants.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Gathering',
        style: 'destructive',
        onPress: () => {
          cancelGathering.mutate(gatheringId, {
            onSuccess: () => navigation.goBack(),
          });
        },
      },
    ]);
  };

  if (isLoading) return <LoadingOverlay visible />;
  if (error || !gathering) return <ErrorState message="Could not load gathering" onRetry={refetch} />;

  const date = new Date(gathering.date);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Typography preset="h2">{gathering.title}</Typography>

        {gathering.description ? (
          <Typography preset="body" color={colors.textSecondary} style={styles.description}>
            {gathering.description}
          </Typography>
        ) : null}

        {/* Date & time */}
        <View style={styles.row}>
          <Icon name="calendar-outline" size={18} color={colors.textSecondary} />
          <Typography preset="body" color={colors.textSecondary}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>

        {/* Location */}
        {gathering.locationName ? (
          <View style={styles.row}>
            <Icon name="location-outline" size={18} color={colors.textSecondary} />
            <Typography preset="body" color={colors.textSecondary}>{gathering.locationName}</Typography>
          </View>
        ) : null}

        {/* Meeting link */}
        {gathering.meetingLink ? (
          <Pressable style={styles.row} onPress={() => Linking.openURL(gathering.meetingLink!)}>
            <Icon name="link-outline" size={18} color={colors.primary} />
            <Typography preset="body" color={colors.primary}>Join Online</Typography>
          </Pressable>
        ) : null}

        {/* Host */}
        <View style={styles.row}>
          <Icon name="person-outline" size={18} color={colors.textSecondary} />
          <Typography preset="body" color={colors.textSecondary}>
            Hosted by {gathering.host.name}
          </Typography>
        </View>

        {/* Participant count */}
        <View style={styles.row}>
          <Icon name="people-outline" size={18} color={colors.textSecondary} />
          <Typography preset="body" color={colors.textSecondary}>
            {gathering._count?.participants ?? 0} participants
          </Typography>
        </View>

        {/* RSVP buttons */}
        {!isHost && (
          <View style={styles.rsvpSection}>
            <Typography preset="label">Your RSVP</Typography>
            <View style={styles.rsvpButtons}>
              {(['GOING', 'MAYBE', 'NOT_GOING'] as const).map(status => (
                <Pressable
                  key={status}
                  style={[
                    styles.rsvpButton,
                    myRsvp?.status === status && styles.rsvpButtonActive,
                  ]}
                  onPress={() => handleRsvp(status)}
                >
                  <Typography
                    preset="bodySm"
                    color={myRsvp?.status === status ? colors.textOnPrimary : colors.textPrimary}
                  >
                    {STATUS_LABELS[status]}
                  </Typography>
                </Pressable>
              ))}
            </View>
            {myRsvp && (
              <Button
                label="Leave Gathering"
                variant="outline"
                onPress={() => {
                  Alert.alert('Leave Gathering', 'You will be removed from participants.', [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: () => leaveGathering.mutate(gatheringId, { onSuccess: () => navigation.goBack() }),
                    },
                  ]);
                }}
                style={styles.leaveButton}
              />
            )}
          </View>
        )}

        {/* Host actions */}
        {isHost && (
          <View style={styles.hostActions}>
            <Button
              label="Edit Gathering"
              variant="outline"
              onPress={() => navigation.navigate('EditGathering', { gatheringId })}
            />
            <Button
              label="Cancel Gathering"
              variant="outline"
              onPress={handleCancel}
              style={styles.cancelButton}
            />
          </View>
        )}

        {/* Participants */}
        {gathering.participants && gathering.participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Typography preset="label">Participants</Typography>
            {gathering.participants.map(p => (
              <View key={p.userId} style={styles.participantRow}>
                <Typography preset="body">{p.user.name}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>
                  {STATUS_LABELS[p.status]}
                </Typography>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingH,
    gap: spacing[3],
  },
  description: {
    marginTop: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rsvpSection: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  leaveButton: {
    borderColor: colors.error,
    marginTop: spacing[2],
  },
  hostActions: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  cancelButton: {
    borderColor: colors.error,
  },
  participantsSection: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
