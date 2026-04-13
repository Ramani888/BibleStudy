import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mapApi } from '../api/map.api';

export function useFriendsLocations() {
  return useQuery({
    queryKey: ['map', 'friends'],
    queryFn: mapApi.getFriendsLocations,
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: ({ lat, lng, locationName }: { lat: number; lng: number; locationName?: string }) =>
      mapApi.updateLocation(lat, lng, locationName),
  });
}

export function useUpdateMapPrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (privacy: 'OFF' | 'FRIENDS' | 'SELECTED' | 'EVERYONE') =>
      mapApi.updatePrivacy(privacy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
