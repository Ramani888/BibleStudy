import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  FileTextIcon, FolderIcon, SearchIcon, UsersIcon,
  CalendarIcon, TrophyIcon, BarChartIcon, PlusCircleIcon,
  type IconComponent,
} from '../components/icons';
import type { AppTabParamList } from '../navigation/types';
import type { StudySet } from '../types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

export function useHomeNavigation(navigation: HomeNav) {
  const { t } = useTranslation('home');
  const goContinue = useCallback((s: StudySet) =>
    navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title }, initial: false }),
  [navigation]);

  const goCreate = useCallback(() =>
    navigation.navigate('LibraryTab', { screen: 'CreateSet', params: {}, initial: false }),
  [navigation]);

  const onAI = useCallback(() =>
    navigation.navigate('AITab', { screen: 'AIChat' }),
  [navigation]);

  const onBell = useCallback(() =>
    navigation.navigate('ProfileTab', { screen: 'Notifications', params: { from: 'Home' }, initial: false }),
  [navigation]);

  const onAvatar = useCallback(() =>
    navigation.navigate('ProfileTab', { screen: 'Profile' }),
  [navigation]);

  const goLibrary      = useCallback(() => navigation.navigate('LibraryTab', { screen: 'Library' }),                                           [navigation]);
  const goNotes        = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Notes',        initial: false }),                       [navigation]);
  const goMedia        = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Media',        initial: false }),                       [navigation]);
  const goPublicSets   = useCallback(() => navigation.navigate('LibraryTab', { screen: 'PublicSets',   initial: false }),                       [navigation]);
  const goFriends      = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Friends',      initial: false }),                       [navigation]);
  const goFriendsSets  = useCallback(() => navigation.navigate('LibraryTab', { screen: 'FriendsSets',  initial: false }),                       [navigation]);
  const goStudyPlans   = useCallback(() => navigation.navigate('LibraryTab', { screen: 'StudyPlans',   initial: false }),                       [navigation]);
  const goAchievements = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Achievements', initial: false }),                       [navigation]);
  const goLeaderboard  = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Leaderboard',  initial: false }),                       [navigation]);

  const goViewSet = useCallback((s: StudySet) =>
    navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title, isOwner: false }, initial: false }),
  [navigation]);

  const quickActions = useMemo<Array<{ label: string; Icon: IconComponent; onPress: () => void }>>(() => [
    { label: t('home:quickActions.createSet', 'Create Set'),     Icon: PlusCircleIcon, onPress: goCreate },
    { label: t('home:quickActions.studyPlans', 'Study Plans'),   Icon: CalendarIcon,   onPress: goStudyPlans },
    { label: t('home:quickActions.achievements', 'Achievements'), Icon: TrophyIcon,     onPress: goAchievements },
    { label: t('home:quickActions.leaderboard', 'Leaderboard'),  Icon: BarChartIcon,   onPress: goLeaderboard },
    { label: t('home:quickActions.notes', 'Notes'),              Icon: FileTextIcon,   onPress: goNotes },
    { label: t('home:quickActions.media', 'Media'),              Icon: FolderIcon,     onPress: goMedia },
    { label: t('home:quickActions.discover', 'Discover'),        Icon: SearchIcon,     onPress: goPublicSets },
    { label: t('home:quickActions.friends', 'Friends'),          Icon: UsersIcon,      onPress: goFriends },
  ], [t, goCreate, goStudyPlans, goAchievements, goLeaderboard, goNotes, goMedia, goPublicSets, goFriends]);

  return {
    goContinue, goCreate,
    onAI, onBell, onAvatar,
    goLibrary, goPublicSets, goFriends, goFriendsSets, goViewSet,
    quickActions,
  };
}
