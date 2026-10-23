import { StackActions, type NavigationProp, type ParamListBase, type RouteProp } from '@react-navigation/native';

/** Route param Home attaches to every screen it opens in another tab. */
export type FromHome = { from?: 'Home' } | undefined;

/**
 * Stack `screenListeners`: going back (in-screen arrow, Android back, iOS swipe) from a
 * screen opened by Home returns to Home, instead of this tab's root screen.
 */
export function returnHomeListeners({ navigation, route }: { navigation: NavigationProp<ParamListBase>; route: RouteProp<ParamListBase> }) {
  return {
    beforeRemove: (e: { data: { action: { type: string } }; preventDefault: () => void }) => {
      const { type } = e.data.action;
      if ((route.params as FromHome)?.from !== 'Home' || (type !== 'GO_BACK' && type !== 'POP')) return;
      e.preventDefault();
      navigation.dispatch(StackActions.popToTop()); // POP_TO_TOP — not re-caught above
      navigation.getParent()?.navigate('HomeTab');
    },
  };
}
