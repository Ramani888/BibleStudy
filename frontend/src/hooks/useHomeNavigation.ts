import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  PlusIcon, DocIcon, LeafIcon, LeaderboardIcon, ImageIcon, ExploreIcon, FriendsIcon,
  type IconComponent,
} from '../components/icons';
import type { AppTabParamList } from '../navigation/types';
import type { StudySet } from '../types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

/** Quick-action tile colour family (Quiet-morning canvas). */
export type QuickTint = 'lilac' | 'leaf' | 'gold';

export function useHomeNavigation(navigation: HomeNav) {
  const { t } = useTranslation('home');
  const goContinue = useCallback((s: StudySet) =>
    navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title }, initial: false }),
  [navigation]);

  const goCreate = useCallback(() =>
    navigation.navigate('LibraryTab', { screen: 'CreateSet', params: {}, initial: false }),
  [navigation]);

  // Via AIConsent: it forwards to AIChat once consent is stored, so Home can't skip it.
  const onAI = useCallback(() =>
    navigation.navigate('AITab', { screen: 'AIConsent' }),
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

  const quickActions = useMemo<Array<{ label: string; Icon: IconComponent; tint: QuickTint; onPress: () => void }>>(() => [
    { label: t('home:quickActions.createSet', 'New set'),         Icon: PlusIcon,        tint: 'lilac', onPress: goCreate },
    { label: t('home:quickActions.studyPlans', 'Study plans'),    Icon: DocIcon,         tint: 'lilac', onPress: goStudyPlans },
    { label: t('home:quickActions.achievements', 'Achievements'), Icon: LeafIcon,        tint: 'leaf',  onPress: goAchievements },
    { label: t('home:quickActions.leaderboard', 'Leaderboard'),   Icon: LeaderboardIcon, tint: 'leaf',  onPress: goLeaderboard },
    { label: t('home:quickActions.notes', 'Notes'),               Icon: DocIcon,         tint: 'gold',  onPress: goNotes },
    { label: t('home:quickActions.media', 'Media'),               Icon: ImageIcon,       tint: 'gold',  onPress: goMedia },
    { label: t('home:quickActions.discover', 'Explore'),          Icon: ExploreIcon,     tint: 'lilac', onPress: goPublicSets },
    { label: t('home:quickActions.friends', 'Friends'),           Icon: FriendsIcon,     tint: 'lilac', onPress: goFriends },
  ], [t, goCreate, goStudyPlans, goAchievements, goLeaderboard, goNotes, goMedia, goPublicSets, goFriends]);

  return {
    goContinue, goCreate,
    onAI, onBell, onAvatar,
    goLibrary, goPublicSets, goFriends, goFriendsSets, goViewSet,
    quickActions,
  };
}
