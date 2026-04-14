import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/Ionicons';

import type { MapScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { useFriendsLocations, useUpdateLocation } from '../../hooks/useMap';
import { useNearbyGatherings } from '../../hooks/useGatherings';

type Props = MapScreenProps<'Map'>;

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);

  const updateLocation = useUpdateLocation();
  const { data: friendsLocations = [] } = useFriendsLocations();
  const { data: nearbyGatherings = [] } = useNearbyGatherings(
    locationReady ? region.latitude : null,
    locationReady ? region.longitude : null
  );

  useEffect(() => {
    Geolocation.requestAuthorization();
    Geolocation.getCurrentPosition(
      ({ coords }) => {
        const newRegion: Region = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        setLocationReady(true);
        updateLocation.mutate({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationReady(true);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateGathering = () => {
    navigation.navigate('CreateGathering', {});
  };

  if (!locationReady) {
    return <LoadingOverlay visible />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {friendsLocations.map(friend => (
          <Marker
            key={friend.id}
            coordinate={{ latitude: friend.locationLat, longitude: friend.locationLng }}
            title={friend.name}
            description={friend.locationName ?? undefined}
          >
            <View style={styles.friendMarker}>
              <Icon name="person" size={14} color={colors.textOnPrimary} />
            </View>
          </Marker>
        ))}

        {nearbyGatherings.map(gathering => (
          gathering.locationLat && gathering.locationLng ? (
            <Marker
              key={gathering.id}
              coordinate={{ latitude: gathering.locationLat, longitude: gathering.locationLng }}
              title={gathering.title}
              description={gathering.locationName ?? undefined}
              pinColor={colors.info}
              onCalloutPress={() => navigation.navigate('GatheringDetail', { gatheringId: gathering.id })}
            />
          ) : null
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Typography preset="h3" style={styles.headerTitle}>Map</Typography>
      </SafeAreaView>

      {/* FAB — create gathering */}
      <View style={styles.fab}>
        <Pressable style={styles.fabButton} onPress={handleCreateGathering}>
          <Icon name="add" size={28} color={colors.textOnPrimary} />
        </Pressable>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Typography preset="caption" color={colors.textSecondary}>Friends</Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Typography preset="caption" color={colors.textSecondary}>Gatherings</Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTitle: {
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: layout.tabBarHeight + spacing[4],
    right: spacing[4],
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  friendMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  legend: {
    position: 'absolute',
    bottom: layout.tabBarHeight + spacing[4],
    left: spacing[4],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: spacing[2],
    gap: spacing[1],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
