import { apiGet, apiPost, apiPut } from './client';
import type { FriendLocation } from '../types/map.types';

const mapApi = {
  updateLocation: (lat: number, lng: number, locationName?: string) =>
    apiPost<{ message: string }>('/map/location', { lat, lng, locationName }),
  getFriendsLocations: () =>
    apiGet<FriendLocation[]>('/map/friends'),
  updatePrivacy: (privacy: 'OFF' | 'FRIENDS' | 'SELECTED' | 'EVERYONE') =>
    apiPut<{ message: string }>('/map/privacy', { privacy }),
};

export { mapApi };
