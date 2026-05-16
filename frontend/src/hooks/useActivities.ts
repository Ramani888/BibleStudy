import { useInfiniteQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api/activities.api';

export function useFriendsActivityFeed() {
  return useInfiniteQuery({
    queryKey: ['activities', 'friends'],
    queryFn: ({ pageParam = 1 }) => activitiesApi.getFriendsFeed(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const currentPage = lastPageParam as number;
      return currentPage < lastPage.pagination.pages ? currentPage + 1 : undefined;
    },
  });
}
