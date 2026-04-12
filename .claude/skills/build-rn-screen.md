---
name: Build RN Screen
description: Step-by-step process for building a new React Native screen in BibleStudyPro following all project conventions
---

## Build a React Native Screen in BibleStudyPro

Follow this exact sequence. Do not skip steps.

### Step 1 — Explore first (graph, not files)
```
get_minimal_context(task="build <ScreenName> screen")
semantic_search_nodes(query="<domain> screen")
```
Read one similar existing screen before writing anything.

### Step 2 — Types
Add new types to `frontend/src/types/<domain>.types.ts` before writing any screen or hook.

### Step 3 — API function
Add to `frontend/src/api/<module>.api.ts`:
```ts
export async function getThings(params?: ThingParams): Promise<Thing[]> {
  const { data } = await apiClient.get<Thing[]>('/things', { params });
  return data;
}
```
Export from `frontend/src/api/index.ts`.

### Step 4 — Hook
Add to `frontend/src/hooks/use<Feature>.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getThings, createThing } from '../api';
import type { CreateThingDto } from '../types/thing.types';

export function useThings() {
  return useQuery({ queryKey: ['things'], queryFn: getThings });
}

export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateThingDto) => createThing(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['things'] }),
  });
}
```
Export from `frontend/src/hooks/index.ts`.

### Step 5 — Navigation
1. Add route to `frontend/src/navigation/types.ts` param list.
2. Add screen to the relevant navigator (e.g. `LibraryNavigator.tsx`).

### Step 6 — Screen file
Template at `frontend/src/screens/<domain>/<ScreenName>Screen.tsx`:
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Typography, Button } from '../../components/ui';
import { EmptyState, ErrorState, LoadingOverlay } from '../../components/feedback';
import { useThings } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function ThingScreen({ navigation }: LibraryScreenProps<'Things'>) {
  const { data, isLoading, error, refetch } = useThings();

  if (isLoading) return <LoadingOverlay />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* content */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing[4] },
});
```

### Step 7 — Verify
```bash
cd frontend && npx tsc --noEmit --pretty false
```
Zero errors before marking complete.

## Token efficiency
- ALWAYS start with `get_minimal_context` before reading files.
- Use `detail_level="minimal"` on all graph calls.
- Target: implement a screen in ≤ 10 tool calls.
