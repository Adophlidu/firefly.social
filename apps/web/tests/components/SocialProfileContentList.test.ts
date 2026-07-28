/// @vitest-environment jsdom

import type { SocialSource } from '@dimensiondev/enums';
import { SocialProfileCategory, Source } from '@dimensiondev/enums';
import { cleanup, render } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { SocialProfileContentList } from '@/components/Profile/SocialProfileContentList.js';
import type { ProfileFeedInitialData } from '@/providers/firefly/metadata/getProfilePageData.js';

// FeedList drives a useSuspenseInfiniteQuery + provider chain. Stub it to a marker so the
// test observes routing without booting react-query.
vi.mock('@/components/Profile/FeedList.js', () => ({
    FeedList: ({ source, profileId }: { source: SocialSource; profileId: string }) =>
        createElement('div', { 'data-testid': `feedlist-${source}-${profileId}` }),
}));

// foxact's noSSR() bails only when `window` is undefined, so in jsdom both branches would
// otherwise render identically. Wrap children in a marker so we can assert whether the Feed
// branch routed through NoSSR (client-only) vs rendered FeedList directly (SSR path).
vi.mock('@/components/NoSSR.js', () => ({
    NoSSR: ({ children }: { children: ReactNode }) => createElement('div', { 'data-testid': 'no-ssr' }, children),
}));

// The non-Feed tabs import .svg assets and react-query providers; they are never reached by
// the Feed branch, so stub them to keep the test isolated and free of asset-loader churn.
vi.mock('@/components/Loading.js', () => ({ Loading: () => createElement('div', { 'data-testid': 'loading' }) }));
vi.mock('@/components/Profile/ChannelList.js', () => ({ ChannelList: () => null }));
vi.mock('@/components/Profile/CollectedList.js', () => ({ CollectedList: () => null }));
vi.mock('@/components/Profile/RepliesList.js', () => ({ RepliesList: () => null }));
vi.mock('@/components/Profile/LikedFeedList.js', () => ({ LikedFeedList: () => null }));
vi.mock('@/components/Profile/MediaList.js', () => ({ MediaList: () => null }));
vi.mock('@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js', () => ({ TrumpTruthSocialPosts: () => null }));

vi.mock('@/hooks/useAsyncStatus.js', () => ({
    // isSyncing=false so behaviour is deterministic (the Feed branch returns before the
    // isSyncing gate anyway).
    useAsyncStatus: () => false,
}));

// Stub the context module with a lightweight context so importing it does not pull in the
// auth/fetcher chain (which fires background fetches under jsdom). The component reads
// `initialFeedPage` via useContext at runtime; tsgo still resolves the real module's types
// for this import, so the Provider value below is checked against the full context type.
vi.mock('@/components/Profile/ProfileContext.js', async () => {
    const { createContext } = await import('react');
    return { ProfileContext: createContext(null) };
});

afterEach(() => {
    cleanup();
});

// Truthy and structurally valid (FeedList, which consumes it, is mocked) — the Feed branch
// only checks truthiness. Empty pages keep the value free of Post plumbing.
const PRESENT_FEED_PAGE: ProfileFeedInitialData = { pages: [], pageParams: [''] };

function renderFeed(source: SocialSource, initialFeedPage: ProfileFeedInitialData | undefined, profileId = 'brem1') {
    return render(
        createElement(
            ProfileContext.Provider,
            {
                value: {
                    profiles: [],
                    isRefreshing: false,
                    refreshedSocialProfile: null,
                    initialFeedPage,
                },
            },
            createElement(SocialProfileContentList, {
                type: SocialProfileCategory.Feed,
                source,
                profileId,
            }),
        ),
    );
}

describe('SocialProfileContentList — Feed branch', () => {
    test('renders client-only (NoSSR) when the SSR feed prefetch is missing (React #419 fix)', () => {
        renderFeed(Source.Lens, undefined);

        // Routed through NoSSR — the server never executes FeedList's suspense query, so a
        // rejecting feed endpoint can no longer crash the Suspense boundary.
        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="feedlist-Lens-brem1"]')).not.toBeNull();
    });

    test('renders FeedList directly (SSR preserved) when the prefetched first page is present', () => {
        renderFeed(Source.Lens, PRESENT_FEED_PAGE);

        // No NoSSR wrapper — the prefetched first page ships in the initial HTML.
        expect(document.querySelector('[data-testid="no-ssr"]')).toBeNull();
        expect(document.querySelector('[data-testid="feedlist-Lens-brem1"]')).not.toBeNull();
    });

    test('renders Farcaster feed client-only when the prefetch is missing (e.g. /profile/farcaster/gabetonic)', () => {
        renderFeed(Source.Farcaster, undefined, 'gabetonic');

        // Same protocol-agnostic path as Lens: no prefetched page → NoSSR, so a rejecting
        // Farcaster feed endpoint can't crash the Suspense boundary either. The fix keys off
        // `!initialFeedPage`, not off the source, so Lens/Farcaster/Bsky are all covered.
        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="feedlist-Farcaster-gabetonic"]')).not.toBeNull();
    });

    test('always renders Twitter feed client-only, even when a prefetch is present', () => {
        renderFeed(Source.Twitter, PRESENT_FEED_PAGE);

        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="feedlist-Twitter-brem1"]')).not.toBeNull();
    });
});
