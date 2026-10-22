import React from 'react';

import { SetBrowser } from './components/SetBrowser';
import type { LibraryScreenProps } from '../../navigation/types';

export function FriendsSetsScreen(_props: LibraryScreenProps<'FriendsSets'>) {
  return <SetBrowser kind="friends" />;
}
