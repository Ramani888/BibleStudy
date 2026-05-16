import { apiGet } from './client';
import type { ActivityFeedResponse } from '../types/activities.types';

const activitiesApi = {
  getFriendsFeed: (page?: number) => apiGet<ActivityFeedResponse>('/activities/friends', { page }),
};

export { activitiesApi };
