/// @vitest-environment jsdom
import { Source } from '@dimensiondev/enums';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSortFireflyProfiles } from '@/components/Profile/ProfileSourceTabs/useSortFireflyProfiles.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

vi.mock('@/hooks/useCurrentProfile.js', () => ({
    useCurrentProfilesAll: vi.fn(),
}));

const useCurrentProfilesAllMock = vi.mocked(useCurrentProfilesAll);

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

function makeProfile(id: string, source: Source, overrides: Partial<FireflyProfile> = {}): FireflyProfile {
    return {
        identity: { id, source },
        displayName: id,
        handle: id,
        __origin__: null,
        ...overrides,
    };
}

function mockCurrentProfiles(lensProfileId: string | null) {
    useCurrentProfilesAllMock.mockReturnValue({
        [Source.Farcaster]: null,
        [Source.Lens]: lensProfileId ? { ...createDummyProfile(Source.Lens), profileId: lensProfileId } : null,
        [Source.Twitter]: null,
        [Source.Bsky]: null,
    });
}

beforeEach(() => {
    useCurrentProfilesAllMock.mockReset();
});

describe('useSortFireflyProfiles', () => {
    it('ranks the explicitly-set primary account above the logged-in account (FW-7908)', () => {
        // Mirrors the reporter's case: viewing /profile/farcaster/new-test, the route
        // identity is Farcaster, so no Lens profile matches it. The logged-in Lens
        // account is `oickill`, but `p_l_p` was set as primary in Settings.
        mockCurrentProfiles('oickill');

        const routeIdentity: FireflyIdentity = { id: 'new-test', source: Source.Farcaster };
        const primaryLens = makeProfile('p_l_p', Source.Lens, { isDefault: true });
        const loggedInLens = makeProfile('oickill', Source.Lens);

        const { result } = renderHook(() => useSortFireflyProfiles(), { wrapper: createWrapper() });
        const sortFn = result.current;

        // primary must sort before the merely-logged-in account
        expect(sortFn(Source.Lens, routeIdentity, primaryLens, loggedInLens)).toBeLessThan(0);
        // symmetric: logged-in must sort after the primary
        expect(sortFn(Source.Lens, routeIdentity, loggedInLens, primaryLens)).toBeGreaterThan(0);
    });

    it('keeps the route-identity profile above a primary profile of the same source (FW-7649)', () => {
        mockCurrentProfiles('other');

        const routeIdentity: FireflyIdentity = { id: 'route-lens', source: Source.Lens };
        const routeLens = makeProfile('route-lens', Source.Lens);
        const primaryLens = makeProfile('primary-lens', Source.Lens, { isDefault: true });

        const { result } = renderHook(() => useSortFireflyProfiles(), { wrapper: createWrapper() });
        const sortFn = result.current;

        // route identity (level 5) still beats a same-source primary (level 4)
        expect(sortFn(Source.Lens, routeIdentity, routeLens, primaryLens)).toBeLessThan(0);
    });

    it('falls back to the logged-in account when no profile is primary', () => {
        mockCurrentProfiles('oickill');

        const routeIdentity: FireflyIdentity = { id: 'new-test', source: Source.Farcaster };
        const loggedInLens = makeProfile('oickill', Source.Lens);
        const plainLens = makeProfile('someone-else', Source.Lens);

        const { result } = renderHook(() => useSortFireflyProfiles(), { wrapper: createWrapper() });
        const sortFn = result.current;

        // logged-in (level 3) still wins over a plain profile (level 0)
        expect(sortFn(Source.Lens, routeIdentity, loggedInLens, plainLens)).toBeLessThan(0);
    });
});
