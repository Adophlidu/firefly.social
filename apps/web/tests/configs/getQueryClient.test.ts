import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { createServerQueryClient, getQueryClient, queryClient } from '@/configs/queryClient.js';

/**
 * Regression coverage for the React hydration #418 on SSR'd feeds (/posts, profile
 * timeline, …). Root cause: the module-singleton server QueryClient was reused across ISR
 * regenerations on warm instances, so a previous regeneration's cached feed was served as a
 * no-op cache hit — `useSuspenseInfiniteQuery` preferred it over the fresh `initialData`,
 * and `ReactQueryStreamedHydration` never re-streams an unchanged hit, so the client
 * hydrated from a different (live) feed → #418.
 *
 * Fix contract encoded below:
 *  - server: `getQueryClient()` hands out a fresh, isolated client PER CALL (one per
 *    request), so no previous regeneration's data can leak forward;
 *  - browser: it returns the shared `queryClient` singleton, so the modules that import it
 *    directly stay in sync with the provider.
 */
describe('getQueryClient', () => {
    // Default vitest environment is node → `typeof window === 'undefined'` → server branch.

    it('returns a QueryClient instance', () => {
        expect(getQueryClient()).toBeInstanceOf(QueryClient);
    });

    it('server: hands out a fresh client on every call (no singleton reuse)', () => {
        const a = getQueryClient();
        const b = getQueryClient();

        expect(a).not.toBe(b);
        expect(getQueryClient()).not.toBe(getQueryClient());
    });

    it('server: each client has its own QueryCache and MutationCache', () => {
        const a = getQueryClient();
        const b = getQueryClient();

        expect(a.getQueryCache()).not.toBe(b.getQueryCache());
        expect(a.getMutationCache()).not.toBe(b.getMutationCache());
    });

    it('server: data written to one request is invisible to the next (no warm-instance leak)', () => {
        // Regeneration N seeds the discover feed into its (per-request) client…
        const requestN = getQueryClient();
        requestN.setQueryData(['posts', 'discover'], { stale: true });

        // …regeneration N+1 must start from an empty cache, forcing it to seed from the
        // fresh `initialData` (and be re-tracked + streamed to the client).
        const requestNPlus1 = getQueryClient();
        expect(requestNPlus1.getQueryData(['posts', 'discover'])).toBeUndefined();
    });

    it('createServerQueryClient builds fully isolated caches', () => {
        const a = createServerQueryClient();
        const b = createServerQueryClient();
        a.setQueryData(['token', '0x0'], { symbol: 'ABC' });

        expect(b.getQueryData(['token', '0x0'])).toBeUndefined();
    });

    it('browser: returns the shared `queryClient` singleton (stable across calls)', () => {
        vi.stubGlobal('window', {});

        try {
            expect(getQueryClient()).toBe(queryClient);
            expect(getQueryClient()).toBe(getQueryClient());
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
