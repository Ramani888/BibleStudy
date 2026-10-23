import { StackActions, type NavigationProp, type ParamListBase, type RouteProp } from '@react-navigation/native';

/** Route param a tab attaches to a screen it opens in another tab (Home's shortcuts, Quiz/Ask → Paywall). */
export type FromHome = { from?: 'Home' | 'QuizTab' | 'AITab' } | undefined;

/**
 * Stack `screenListeners`: going back (in-screen arrow, Android back, iOS swipe) from a
 * screen opened from another tab returns to that tab, instead of this tab's root screen.
 */
export function returnHomeListeners({ navigation, route }: { navigation: NavigationProp<ParamListBase>; route: RouteProp<ParamListBase> }) {
  return {
    beforeRemove: (e: { data: { action: { type: string } }; preventDefault: () => void }) => {
      const { type } = e.data.action;
      const from = (route.params as FromHome)?.from;
      if (!from || (type !== 'GO_BACK' && type !== 'POP')) return;
      e.preventDefault();
      navigation.dispatch(StackActions.popToTop()); // POP_TO_TOP — not re-caught above
      navigation.getParent()?.navigate(from === 'Home' ? 'HomeTab' : from);
    },
  };
}
