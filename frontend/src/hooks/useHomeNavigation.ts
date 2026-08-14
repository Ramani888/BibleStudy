import { useCallback, useMemo } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CheckCircleIcon, FileTextIcon, FolderIcon, LibraryIcon,
  SearchIcon, SparklesIcon, UsersIcon, UserIcon,
  type IconComponent,
} from '../components/icons';
import type { AppTabParamList } from '../navigation/types';
import type { StudySet } from '../types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

export function useHomeNavigation(navigation: HomeNav) {
  const goReview = useCallback((setId: string, setTitle: string) =>
    navigation.navigate('QuizTab', { screen: 'QuizSetup', params: { preSelectedSetIds: [setId], preSelectedSetTitles: [setTitle] }, initial: false }),
  [navigation]);

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

  const goLibrary     = useCallback(() => navigation.navigate('LibraryTab', { screen: 'Library' }),                                          [navigation]);
  const goQuizHub     = useCallback(() => navigation.navigate('QuizTab',    { screen: 'QuizHub' }),                                           [navigation]);
  const goAIChat      = useCallback(() => navigation.navigate('AITab',      { screen: 'AIChat' }),                                            [navigation]);
  const goNotes       = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Notes',      initial: false }),                        [navigation]);
  const goMedia       = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Media',      initial: false }),                        [navigation]);
  const goPublicSets  = useCallback(() => navigation.navigate('LibraryTab', { screen: 'PublicSets', initial: false }),                        [navigation]);
  const goFriends     = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Friends',    initial: false }),                        [navigation]);
  const goProfile     = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Profile' }),                                           [navigation]);
  const goFriendsSets = useCallback(() => navigation.navigate('LibraryTab', { screen: 'FriendsSets', initial: false }),                       [navigation]);

  const goViewSet = useCallback((s: StudySet) =>
    navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title, isOwner: false }, initial: false }),
  [navigation]);

  const quickActions = useMemo<Array<{ label: string; Icon: IconComponent; onPress: () => void }>>(() => [
    { label: 'Library',  Icon: LibraryIcon,    onPress: goLibrary },
    { label: 'Quiz',     Icon: CheckCircleIcon, onPress: goQuizHub },
    { label: 'AI Chat',  Icon: SparklesIcon,    onPress: goAIChat },
    { label: 'Notes',    Icon: FileTextIcon,    onPress: goNotes },
    { label: 'Media',    Icon: FolderIcon,      onPress: goMedia },
    { label: 'Discover', Icon: SearchIcon,      onPress: goPublicSets },
    { label: 'Friends',  Icon: UsersIcon,       onPress: goFriends },
    { label: 'Profile',  Icon: UserIcon,        onPress: goProfile },
  ], [goLibrary, goQuizHub, goAIChat, goNotes, goMedia, goPublicSets, goFriends, goProfile]);

  return {
    goReview, goContinue, goCreate,
    onAI, onBell, onAvatar,
    goLibrary, goPublicSets, goFriends, goFriendsSets, goViewSet,
    quickActions,
  };
}
