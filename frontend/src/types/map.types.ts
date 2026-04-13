export interface FriendLocation {
  id: string;
  name: string;
  profileImage: string | null;
  locationLat: number;
  locationLng: number;
  locationName: string | null;
  lastLocationAt: string;
}
