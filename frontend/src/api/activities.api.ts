import { apiGet } from './client';
import type { ActivityFeedResponse } from '../types/activities.types';

const activitiesApi = {
  getMyFeed:      (page?: number) => apiGet<ActivityFeedResponse>('/activities', { page }),
  getFriendsFeed: (page?: number) => apiGet<ActivityFeedResponse>('/activities/friends', { page }),
};

export { activitiesApi };
