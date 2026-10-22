import React from 'react';

import { SetBrowser } from './components/SetBrowser';
import type { LibraryScreenProps } from '../../navigation/types';

export function PublicSetsScreen(_props: LibraryScreenProps<'PublicSets'>) {
  return <SetBrowser kind="explore" />;
}
