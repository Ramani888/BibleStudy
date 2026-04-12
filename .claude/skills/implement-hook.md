---
name: Implement Hook
description: Add a new React Query hook to BibleStudyPro following the project's query key conventions, mutation patterns, and file organization
---

## Implement a React Query Hook in BibleStudyPro

### Before writing
1. Check if the hook already exists: `semantic_search_nodes(query="use<Feature>")`
2. Read one similar existing hook (e.g. `useSets.ts`) before writing.

### Query key conventions
| Scope | Key |
|-------|-----|
| All items | `['things']` |
| Single item | `['things', id]` |
| Filtered | `['things', { filter, page }]` |
| Nested | `['things', thingId, 'items']` |

Be consistent — the mutation `invalidateQueries` must match the query key exactly.

### Full hook template
```ts
// frontend/src/hooks/useThings.ts
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getThings, getThingById, createThing, updateThing, deleteThing } from '../api';
import type { CreateThingDto, UpdateThingDto } from '../types/thing.types';

const THING_KEYS = {
  all: ['things'] as const,
  byId: (id: string) => ['things', id] as const,
};

/** List all things */
export function useThings() {
  return useQuery({
    queryKey: THING_KEYS.all,
    queryFn: getThings,
  });
}

/** Single thing by ID */
export function useThing(id: string) {
  return useQuery({
    queryKey: THING_KEYS.byId(id),
    queryFn: () => getThingById(id),
    enabled: !!id,
  });
}

/** Create */
export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateThingDto) => createThing(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: THING_KEYS.all });
    },
  });
}

/** Update */
export function useUpdateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateThingDto }) => updateThing(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: THING_KEYS.all });
      qc.invalidateQueries({ queryKey: THING_KEYS.byId(id) });
    },
  });
}

/** Delete */
export function useDeleteThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteThing(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: THING_KEYS.all });
    },
  });
}
```

### After writing the hook
1. Export all functions from `frontend/src/hooks/index.ts`.
2. Run `npx tsc --noEmit --pretty false` from `frontend/`.
3. Verify zero errors before marking complete.

### Common mistakes to avoid
- Do NOT put the query key inline as a literal — define it in a `THING_KEYS` object for reuse.
- Do NOT forget `enabled: !!id` on queries that take a required param.
- Do NOT skip `invalidateQueries` in mutations — stale data causes visible bugs.
- Do NOT call hooks conditionally inside a component.
