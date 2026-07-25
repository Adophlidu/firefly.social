/// @vitest-environment jsdom

// React #419 ("the server could not finish this Suspense boundary") on /token/:symbol fires
// from this tab: SwapTimeline drives a useSuspenseInfiniteQuery (networkMode: 'always') with no
// SSR prefetch in the token layout, so during SSR its queryFn runs server-side and a rejecting
// endpoint crashes the <Suspense> boundary — the client then observes #419. The fix wraps the
// <Suspense> in <NoSSR> (foxact noSSR() bails out on the server), so the swap-timeline query
// never runs during SSR. This test guards that routing: every <SwapTimeline> branch renders
// *through* <NoSSR> (client-only). The generic server-side mechanism is covered by
// SSRSuspenseRejection.test.ts; here we assert the component-level wiring.

import { cleanup, render } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { Transactions } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/categories/Transactions.js';

// Per-test knobs. isLogin drives the following-while-logged-out fallback; tx drives the active
// subcategory (mirrors the `?tx=` search param).
const { isLoginMock, searchParamsMock } = vi.hoisted(() => ({
    isLoginMock: vi.fn(),
    searchParamsMock: vi.fn(),
}));

// SwapTimeline is the rejecting suspense boundary under test. Stub it to a marker that surfaces
// which branch rendered (isFollowing vs an address), so we can assert routing without booting
// react-query.
vi.mock('@/components/Swap/SwapTimeline.js', () => ({
    SwapTimeline: ({ isFollowing, address }: { isFollowing?: boolean; address?: string }) =>
        createElement('div', {
            'data-testid': 'swap-timeline',
            'data-is-following': isFollowing ? 'true' : 'false',
            'data-address': address ?? '',
        }),
}));

// foxact's noSSR() only bails when `window` is undefined, so in jsdom the wrapped and unwrapped
// paths would render identically. Wrap children in a marker so we can assert the SwapTimeline
// branches routed through NoSSR (client-only) — i.e. the server never executes them.
vi.mock('@/components/NoSSR.js', () => ({
    NoSSR: ({ children }: { children: ReactNode }) => createElement('div', { 'data-testid': 'no-ssr' }, children),
}));

vi.mock('@/components/NotLoginFallback.js', () => ({
    NotLoginFallback: () => createElement('div', { 'data-testid': 'not-login-fallback' }),
}));

vi.mock('@/components/Avatar.js', () => ({
    Avatar: () => createElement('div', { 'data-testid': 'avatar' }),
}));

vi.mock('@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/loading.js', () => ({
    default: () => createElement('div', { 'data-testid': 'token-loading' }),
}));

vi.mock('@/esm/Link.js', () => ({
    Link: ({ children }: { children?: ReactNode }) => createElement('a', null, children),
}));

vi.mock('@/esm/navigation.js', () => ({
    usePathname: () => '/token/cex/gho',
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => searchParamsMock(),
}));

vi.mock('@/hooks/useIsLoginFirefly.js', () => ({
    useIsLoginFirefly: () => isLoginMock(),
}));

vi.mock('@/hooks/useAccountByNetwork.js', () => ({
    useWalletAccountAll: () => ({
        ethereum: { address: '0xeth0000', chainId: 1, isConnected: true },
        solana: { address: '0xsol0000', chainId: 101, isConnected: false },
    }),
}));

vi.mock('@/helpers/getStampAvatarByProfileId.js', () => ({
    getStampAvatarByProfileId: () => 'stamp-url',
}));
vi.mock('@/helpers/getWalletProfileAvatar.js', () => ({
    getWalletProfileAvatar: () => 'wallet-avatar-url',
}));
vi.mock('@/helpers/swapActivityToTradeRecord.js', () => ({
    swapActivityToTradeRecord: () => null,
}));

vi.mock('@lingui/core/macro', () => ({ t: (strings: TemplateStringsArray) => strings[0] }));
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: ReactNode }) => children }));

function setSearchParam(tx: string | null) {
    searchParamsMock.mockReturnValue(new URLSearchParams(tx ? `tx=${tx}` : ''));
}

function renderTransactions(props: { trader?: string; traderName?: string; chainId?: number; tokenAddress?: string }) {
    return render(
        createElement(Transactions, {
            chainId: props.chainId ?? 1,
            tokenAddress: props.tokenAddress ?? '0xgho',
            trader: props.trader,
            traderName: props.traderName,
        }),
    );
}

afterEach(() => {
    cleanup();
    isLoginMock.mockReset();
    searchParamsMock.mockReset();
});

describe('Transactions — swap-timeline branches are client-only (React #419 fix)', () => {
    test('Following branch renders through NoSSR (server never runs the swap query)', () => {
        isLoginMock.mockReturnValue(true);
        setSearchParam(null); // default tab → first subcategory = "following"

        renderTransactions({});

        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        const timeline = document.querySelector('[data-testid="swap-timeline"]');
        expect(timeline).not.toBeNull();
        expect(timeline?.getAttribute('data-is-following')).toBe('true');
    });

    test('Mine branch renders through NoSSR', () => {
        isLoginMock.mockReturnValue(true);
        setSearchParam('mine');

        renderTransactions({});

        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        const timeline = document.querySelector('[data-testid="swap-timeline"]');
        expect(timeline).not.toBeNull();
        expect(timeline?.getAttribute('data-is-following')).toBe('false');
        expect(timeline?.getAttribute('data-address')).toBe('0xeth0000');
    });

    test('Trader branch renders through NoSSR', () => {
        isLoginMock.mockReturnValue(true);
        setSearchParam(null); // trader provided → first subcategory = "trader"

        renderTransactions({ trader: '0xtrader', traderName: 'Alice' });

        expect(document.querySelector('[data-testid="no-ssr"]')).not.toBeNull();
        const timeline = document.querySelector('[data-testid="swap-timeline"]');
        expect(timeline).not.toBeNull();
        expect(timeline?.getAttribute('data-is-following')).toBe('false');
        expect(timeline?.getAttribute('data-address')).toBe('0xtrader');
    });

    test('logged-out Following renders the top-level fallback, NOT routed through NoSSR', () => {
        isLoginMock.mockReturnValue(false);
        setSearchParam(null);

        renderTransactions({});

        // The sibling not-login branch is outside <NoSSR>; only the suspense subtree is wrapped.
        expect(document.querySelector('[data-testid="not-login-fallback"]')).not.toBeNull();
        expect(document.querySelector('[data-testid="no-ssr"]')).toBeNull();
        expect(document.querySelector('[data-testid="swap-timeline"]')).toBeNull();
    });
});
