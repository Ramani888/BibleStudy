---
name: Connect API
description: Add a new API function to the BibleStudyPro axios client layer, connect it to a backend route, and wire it to a hook. Use when a screen needs a backend endpoint that isn't yet in the API layer.
---

## Connect a New API Endpoint in BibleStudyPro

### Step 0 — Verify the backend route exists
```bash
grep -r "router\.(get|post|put|patch|delete)" backend/src/routes/ | grep "<endpoint>"
```
If the route doesn't exist, it must be built in the backend first — that is a separate task.

### Step 1 — Add types
In `frontend/src/types/<domain>.types.ts`:
```ts
export interface Thing {
  id: string;
  title: string;
  createdAt: string;
}

export interface CreateThingDto {
  title: string;
}

export interface UpdateThingDto {
  title?: string;
}
```

### Step 2 — Add API function
In `frontend/src/api/<module>.api.ts`:
```ts
import apiClient from './client';
import type { Thing, CreateThingDto, UpdateThingDto } from '../types/thing.types';

/** GET /things */
export async function getThings(): Promise<Thing[]> {
  const { data } = await apiClient.get<Thing[]>('/things');
  return data;
}

/** GET /things/:id */
export async function getThingById(id: string): Promise<Thing> {
  const { data } = await apiClient.get<Thing>(`/things/${id}`);
  return data;
}

/** POST /things */
export async function createThing(dto: CreateThingDto): Promise<Thing> {
  const { data } = await apiClient.post<Thing>('/things', dto);
  return data;
}

/** PATCH /things/:id */
export async function updateThing(id: string, dto: UpdateThingDto): Promise<Thing> {
  const { data } = await apiClient.patch<Thing>(`/things/${id}`, dto);
  return data;
}

/** DELETE /things/:id */
export async function deleteThing(id: string): Promise<void> {
  await apiClient.delete(`/things/${id}`);
}
```

### Step 3 — Export from index
In `frontend/src/api/index.ts` — add:
```ts
export { getThings, getThingById, createThing, updateThing, deleteThing } from './<module>.api';
```

### Step 4 — Wire to a hook
Follow the `implement-hook` skill.

### Step 5 — Verify
```bash
cd frontend && npx tsc --noEmit --pretty false
```

## API client notes
- `apiClient` at `frontend/src/api/client.ts` automatically:
  - Attaches `Authorization: Bearer <access_token>` from auth store
  - Handles 401 → token refresh → retry
  - Throws standardized errors via response interceptor
- Base URL is `/api/v1` — **do not repeat it** in API functions.
- Do NOT import `axios` directly in API files — always use `apiClient`.

## Error handling
`getErrorMessage(error)` from `frontend/src/api/index.ts` extracts the message from backend error responses. Use it in Toast calls:
```ts
onError: err => Toast.show({ type: 'error', text1: getErrorMessage(err) })
```
