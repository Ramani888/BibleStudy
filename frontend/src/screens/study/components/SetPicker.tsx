import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SetCard } from '../../../components/domain';
import { SetCardSkeleton } from '../../../components/feedback';
import { Button, Spacer, Typography } from '../../../components/ui';
import { useSets } from '../../../hooks';
import { colors, layout, spacing } from '../../../theme';
import type { LibraryScreenProps } from '../../../navigation/types';

const ICON_SIZE = 56;

type StudyNav = LibraryScreenProps<'Study'>['navigation'];

export function SetPicker() {
  const navigation = useNavigation<StudyNav>();
  const { data: sets = [], isLoading } = useSets();

  if (isLoading) {
    return (
      <View style={styles.pickerWrap}>
        <SetCardSkeleton />
        <SetCardSkeleton />
        <SetCardSkeleton />
      </View>
    );
  }

  if (sets.length === 0) {
    return (
      <View style={styles.noSetWrap}>
        <Icon name="library-outline" size={ICON_SIZE} color={colors.textDisabled} />
        <Typography preset="h3" align="center">No Sets Yet</Typography>
        <Typography preset="body" color={colors.textSecondary} align="center" style={styles.noSetSub}>
          Create a set in the Library to start studying.
        </Typography>
        <Spacer size={spacing[6]} />
        <Button label="Go to Library" onPress={() => navigation.navigate('LibraryTab')} variant="outline" />
      </View>
    );
  }

  return (
    <FlatList
      data={sets}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.pickerList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Typography preset="h4" style={styles.pickerHeader}>Choose a Set to Study</Typography>
      }
      ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
      renderItem={({ item }) => (
        <SetCard
          set={item}
          onPress={() => navigation.navigate('Study', { setId: item.id, setTitle: item.title })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  pickerWrap: { padding: layout.screenPaddingH, gap: spacing[3] },
  pickerList: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
  pickerHeader: { marginBottom: spacing[3] },
  noSetWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
  noSetSub: { marginTop: spacing[2] },
});
