/// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    mergePerpsFills,
    perpsAccountQueryKeyPrefix,
    perpsAggregatedFillsQueryKey,
    perpsOpenOrdersQueryKeyPrefix,
} from '@/components/Perps/perpsAccountSubscriptions.js';
import { usePerpsAccountSubscriptions } from '@/components/Perps/usePerpsAccountSubscriptions.js';

const { clearinghouseState, openOrders, spotState, unsubscribe, usePerpsClient, usePerpsMarkets, userFills } =
    vi.hoisted(() => ({
        clearinghouseState: vi.fn(),
        openOrders: vi.fn(),
        spotState: vi.fn(),
        unsubscribe: vi.fn(),
        usePerpsClient: vi.fn(),
        usePerpsMarkets: vi.fn(),
        userFills: vi.fn(),
    }));

vi.mock('@dimensiondev/perps-react', () => ({
    perpsQueryKeys: {
        account: (address: string, dex = '') => ['perps', 'account', address, dex],
        fills: (address: string) => ['perps', 'fills', address],
        openOrders: (address: string, dex = '') => ['perps', 'open-orders', address, dex],
        spotAccount: (address: string) => ['perps', 'spot-account', address],
    },
    usePerpsClient,
    usePerpsMarkets,
}));

const ADDRESS = '0x0000000000000000000000000000000000000001' as const;

function createFill(tid: number, time: number) {
    return {
        coin: 'BTC',
        px: '64000',
        sz: '0.001',
        side: 'B' as const,
        time,
        startPosition: '0',
        dir: 'Open Long',
        closedPnl: '0',
        hash: `0x${'0'.repeat(64)}` as `0x${string}`,
        oid: tid,
        crossed: true,
        fee: '0.01',
        tid,
        feeToken: 'USDC',
        twapId: null,
    };
}

beforeEach(() => {
    unsubscribe.mockReset();

    for (const subscribe of [clearinghouseState, openOrders, spotState, userFills]) {
        subscribe.mockReset();
        subscribe.mockImplementation(async () => ({ unsubscribe }));
    }

    usePerpsClient.mockReturnValue({
        subscriptions: { clearinghouseState, openOrders, spotState, userFills },
    });
    usePerpsMarkets.mockReturnValue({
        data: [{ universe: [{ name: 'BTC' }] }, { universe: [{ name: 'xyz:XYZ100' }] }],
    });
});

afterEach(cleanup);

describe('Perpetuals account subscriptions', () => {
    it('merges new fills ahead of the snapshot without duplicates', () => {
        const first = createFill(1, 100);
        const second = createFill(2, 200);

        expect(mergePerpsFills([first], [second, first])).toEqual([second, first]);
    });

    it('builds address-level query prefixes that include every DEX', () => {
        expect(perpsAccountQueryKeyPrefix(ADDRESS)).toEqual(['perps', 'account', ADDRESS]);
        expect(perpsOpenOrdersQueryKeyPrefix(ADDRESS)).toEqual(['perps', 'open-orders', ADDRESS]);
    });

    it('streams account data into the HTTP query caches', async () => {
        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
        const { unmount } = renderHook(() => usePerpsAccountSubscriptions(ADDRESS), { wrapper });

        await waitFor(() => expect(clearinghouseState).toHaveBeenCalledTimes(2));

        expect(clearinghouseState.mock.calls.map(([params]) => params.dex)).toEqual(['', 'xyz']);
        expect(openOrders.mock.calls.map(([params]) => params.dex)).toEqual(['', 'xyz']);
        expect(userFills).toHaveBeenCalledOnce();

        act(() => {
            clearinghouseState.mock.calls[0][1]({ clearinghouseState: { withdrawable: '12' } });
            clearinghouseState.mock.calls[1][1]({ clearinghouseState: { assetPositions: [{ position: 'xyz' }] } });
            spotState.mock.calls[0][1]({ spotState: { balances: [] } });
            openOrders.mock.calls[0][1]({ orders: [{ oid: 1 }] });
            openOrders.mock.calls[1][1]({ orders: [{ oid: 2 }] });
            userFills.mock.calls[0][1]({ fills: [createFill(1, 100)], isSnapshot: true });
            userFills.mock.calls[0][1]({ fills: [createFill(2, 200)] });
        });

        expect(queryClient.getQueryData(['perps', 'account', ADDRESS, ''])).toEqual({ withdrawable: '12' });
        expect(queryClient.getQueryData(['perps', 'account', ADDRESS, 'xyz'])).toEqual({
            assetPositions: [{ position: 'xyz' }],
        });
        expect(queryClient.getQueryData(['perps', 'spot-account', ADDRESS])).toEqual({ balances: [] });
        expect(queryClient.getQueryData(['perps', 'open-orders', ADDRESS, ''])).toEqual([{ oid: 1 }]);
        expect(queryClient.getQueryData(['perps', 'open-orders', ADDRESS, 'xyz'])).toEqual([{ oid: 2 }]);
        expect(queryClient.getQueryData(perpsAggregatedFillsQueryKey(ADDRESS))).toEqual([
            createFill(2, 200),
            createFill(1, 100),
        ]);

        unmount();
        await waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(6));
    });
});
