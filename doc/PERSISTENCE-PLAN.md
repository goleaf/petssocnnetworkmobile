# Persistence Layer Migration Plan

The current demo relies on browser `localStorage` for all data. To graduate the
experience beyond the mock demo, we can progressively replace the default data
adapter with a remote API client.

## Abstraction

`lib/storage.ts` now exposes `setStorageAdapter(adapter)`. Any adapter that
implements the shape

```ts
type StorageAdapter = {
  read<T>(key: string, fallback: T): T
  write<T>(key: string, value: T): void
  remove(key: string): void
}
```

can be registered at boot. The default adapter persists JSON snapshots in the
browser, but a remote adapter could call REST, GraphQL, or Firebase.

## Recommended Next Steps

1. **Create an API client** – e.g. `lib/adapters/http-storage.ts` that maps each
   key to concrete endpoints (`GET /groups`, `POST /groups/:id/members`, etc.).
2. **Hydrate on server** – fetch initial data via `fetch`/`axios` in `layout.tsx`
   (or per-route loaders) and inject an adapter that proxies to the API.
3. **Optimistic updates** – keep the storage API synchronous for UI simplicity,
   but internally fire async mutations and reconcile responses.
4. **Authentication** – issue JWT/bearer tokens from the auth provider and
   forward them through the adapter.
5. **Selective persistence** – when a permission check or query only needs a
   subset of fields, expose more granular endpoints to avoid transferring the
   entire JSON blob.

By isolating the storage calls behind `setStorageAdapter`, we can migrate a
single feature (e.g. groups) to remote persistence without touching the rest of
the codebase. Once the remote adapter is stable, the local mock adapter can
remain available for offline demos and test environments.
