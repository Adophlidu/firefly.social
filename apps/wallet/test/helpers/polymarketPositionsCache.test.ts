import { QueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    getPositionsQueryKey,
    optimisticAddPosition,
    optimisticSubtractPositionShares,
    optimisticUpdatePositionShares,
    positionMatches,
    type PositionsInfiniteData,
} from '@/helpers/polymarketPositionsCache';
import type { PolymarketPosition } from '@/providers/types/Firefly';

const TEST_PROXY_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678' as const;

function createMockPosition(overrides: Partial<PolymarketPosition> = {}): PolymarketPosition {
    return {
        is_closed: false,
        negRisk: false,
        isClaimable: false,
        isWin: false,
        event_slugs: ['test-event'],
        cur_price: 0.5,
        title: 'Test Market',
        image: 'https://example.com/image.png',
        offset: 0,
        closed_time: 0,
        conditionId: 'condition-123',
        vote_status: 'Yes',
        resolvedResult: '',
        umaResolutionStatus: 'resolved',
        umaResolutionStatuses: [],
        wallet: '0x1234567890abcdef1234567890abcdef12345678',
        tokenId: 'token-abc',
        Id: 'condition-123-token-abc',
        shares: 100,
        total_buy: 50,
        avg_price: 0.5,
        notfill_pnl: 0,
        fill_pnl: 0,
        pnl: 0,
        pnl_rate: 0,
        marketSlug: 'test-market',
        ...overrides,
    };
}

describe('getPositionsQueryKey', () => {
    it('returns correct query key format', () => {
        const key = getPositionsQueryKey('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
        expect(key).toEqual(['polymarket-positions', '0xabcdef1234567890abcdef1234567890abcdef12']);
    });

    it('lowercases the address', () => {
        const key = getPositionsQueryKey('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');
        expect(key[1]).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });
});

describe('positionMatches', () => {
    const basePosition = createMockPosition({
        conditionId: 'cond-1',
        tokenId: 'token-1',
        vote_status: 'Yes',
    });

    it('returns false when conditionId does not match', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-2' }, false);
        expect(result).toBe(false);
    });

    it('returns true when tokenId matches', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1', tokenId: 'token-1' }, false);
        expect(result).toBe(true);
    });

    it('returns false when tokenId does not match (non-unique condition)', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1', tokenId: 'token-2' }, false);
        expect(result).toBe(false);
    });

    it('returns true when outcomeLabel matches and isUniqueCondition', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1', outcomeLabel: 'Yes' }, true);
        expect(result).toBe(true);
    });

    it('returns false when outcomeLabel matches but not unique condition', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1', outcomeLabel: 'Yes' }, false);
        expect(result).toBe(false);
    });

    it('handles case-insensitive outcomeLabel matching', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1', outcomeLabel: 'YES' }, true);
        expect(result).toBe(true);
    });

    it('returns true for unique condition with only conditionId', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1' }, true);
        expect(result).toBe(true);
    });

    it('returns false for non-unique condition with only conditionId', () => {
        const result = positionMatches(basePosition, { conditionId: 'cond-1' }, false);
        expect(result).toBe(false);
    });
});

describe('optimisticAddPosition', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    it('does not add position when shares is 0', () => {
        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 0,
            purchasePrice: 0.5,
            curPrice: 0.55,
            marketData: { title: 'Test', image: '', marketSlug: 'test', outcomeLabel: 'Yes' },
        });
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data).toBeUndefined();
    });

    it('does not add position when shares is negative', () => {
        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: -10,
            purchasePrice: 0.5,
            curPrice: 0.55,
            marketData: { title: 'Test', image: '', marketSlug: 'test', outcomeLabel: 'Yes' },
        });
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data).toBeUndefined();
    });

    it('does not add position when price is 0', () => {
        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            purchasePrice: 0,
            curPrice: 0.55,
            marketData: { title: 'Test', image: '', marketSlug: 'test', outcomeLabel: 'Yes' },
        });
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data).toBeUndefined();
    });

    it('creates new InfiniteData when cache is empty', () => {
        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            purchasePrice: 0.5,
            curPrice: 0.55,
            marketData: { title: 'Test Market', image: 'img.png', marketSlug: 'test', outcomeLabel: 'Yes' },
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data).toBeDefined();
        expect(data?.pages).toHaveLength(1);
        expect(data?.pages[0]?.data).toHaveLength(1);
        expect(data?.pages[0]?.data?.[0]?.shares).toBe(100);
        expect(data?.pages[0]?.data?.[0]?.total_buy).toBe(50); // 100 * 0.5
        expect(data?.pages[0]?.data?.[0]?.avg_price).toBe(0.5);
    });

    it('adds position to beginning of first page when data exists', () => {
        const existingPosition = createMockPosition({ conditionId: 'existing-cond', tokenId: 'existing-token' });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [existingPosition], cursor: 'cursor-1' }],
            pageParams: [undefined],
        });

        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'new-cond',
            tokenId: 'new-token',
            shares: 50,
            purchasePrice: 0.6,
            curPrice: 0.65,
            marketData: { title: 'New Market', image: '', marketSlug: 'new', outcomeLabel: 'No' },
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data).toHaveLength(2);
        expect(data?.pages[0]?.data?.[0]?.conditionId).toBe('new-cond');
        expect(data?.pages[0]?.data?.[1]?.conditionId).toBe('existing-cond');
    });

    it('calculates total_buy correctly with BigNumber precision', () => {
        optimisticAddPosition(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: '100.123456789',
            purchasePrice: '0.567890123',
            curPrice: 0.55,
            marketData: { title: 'Test', image: '', marketSlug: 'test', outcomeLabel: 'Yes' },
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        const position = data?.pages[0]?.data?.[0];
        // total_buy = shares * price = 100.123456789 * 0.567890123
        const expected = BigNumber('100.123456789').times('0.567890123').toNumber();
        expect(position?.total_buy).toBeCloseTo(expected, 10);
    });
});

describe('optimisticUpdatePositionShares', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    it('returns false when shareDelta is 0', () => {
        const result = optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1' },
            shareDelta: 0,
        });
        expect(result).toBe(false);
    });

    it('returns false when no matching position exists', () => {
        const position = createMockPosition({ conditionId: 'cond-1', tokenId: 'token-1' });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        const result = optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-2', tokenId: 'token-2' },
            shareDelta: 50,
        });
        expect(result).toBe(false);
    });

    it('increases shares correctly', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            total_buy: 50,
            avg_price: 0.5,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        const result = optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            shareDelta: 50,
            purchasePrice: 0.6,
        });

        expect(result).toBe(true);
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        const updatedPosition = data?.pages[0]?.data?.[0];
        expect(updatedPosition?.shares).toBe(150); // 100 + 50
        expect(updatedPosition?.total_buy).toBe(80); // 50 + (50 * 0.6)
        // Weighted avg = 80 / 150 = 0.533...
        expect(updatedPosition?.avg_price).toBeCloseTo(80 / 150, 10);
    });

    it('calculates weighted average price correctly', () => {
        // Initial: 100 shares at $0.40 = $40 total
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            total_buy: 40,
            avg_price: 0.4,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        // Buy 100 more shares at $0.60 = $60 additional
        optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            shareDelta: 100,
            purchasePrice: 0.6,
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        const updatedPosition = data?.pages[0]?.data?.[0];
        expect(updatedPosition?.shares).toBe(200);
        expect(updatedPosition?.total_buy).toBe(100); // 40 + 60
        expect(updatedPosition?.avg_price).toBe(0.5); // 100 / 200
    });

    it('updates cur_price when provided', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            cur_price: 0.5,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            shareDelta: 50,
            purchasePrice: 0.6,
            curPrice: 0.65,
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data?.[0]?.cur_price).toBe(0.65);
    });

    it('does not update avg_price when purchasePrice is not provided', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
            total_buy: 50,
            avg_price: 0.5,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        optimisticUpdatePositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            shareDelta: 50,
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        const updatedPosition = data?.pages[0]?.data?.[0];
        expect(updatedPosition?.shares).toBe(150);
        expect(updatedPosition?.avg_price).toBe(0.5); // unchanged
        expect(updatedPosition?.total_buy).toBe(50); // unchanged
    });
});

describe('optimisticSubtractPositionShares', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    it('returns false when sharesToSubtract is 0', () => {
        const result = optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1' },
            sharesToSubtract: 0,
        });
        expect(result).toBe(false);
    });

    it('returns false when sharesToSubtract is negative', () => {
        const result = optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1' },
            sharesToSubtract: -10,
        });
        expect(result).toBe(false);
    });

    it('decreases shares correctly', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        const result = optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            sharesToSubtract: 30,
        });

        expect(result).toBe(true);
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data?.[0]?.shares).toBe(70);
    });

    it('removes position when shares become zero', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        const result = optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            sharesToSubtract: 100,
        });

        expect(result).toBe(true);
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data).toHaveLength(0);
    });

    it('removes position when shares become negative (oversold)', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            sharesToSubtract: 150,
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data).toHaveLength(0);
    });

    it('handles multi-page data correctly', () => {
        const pos1 = createMockPosition({ conditionId: 'cond-1', tokenId: 'token-1', shares: 50 });
        const pos2 = createMockPosition({ conditionId: 'cond-2', tokenId: 'token-2', shares: 100 });
        const pos3 = createMockPosition({ conditionId: 'cond-3', tokenId: 'token-3', shares: 75 });

        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [
                { data: [pos1], cursor: 'cursor-1' },
                { data: [pos2, pos3], cursor: null },
            ],
            pageParams: [undefined, 'cursor-1'],
        });

        // Sell all of pos2 (in second page)
        optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-2', tokenId: 'token-2' },
            sharesToSubtract: 100,
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data).toHaveLength(1);
        expect(data?.pages[1]?.data).toHaveLength(1); // pos2 removed, pos3 remains
        expect(data?.pages[1]?.data?.[0]?.conditionId).toBe('cond-3');
    });

    it('preserves BigNumber precision', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            shares: 100.123456789,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', tokenId: 'token-1' },
            sharesToSubtract: '50.567890123',
        });

        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        const expected = BigNumber('100.123456789').minus('50.567890123').toNumber();
        expect(data?.pages[0]?.data?.[0]?.shares).toBeCloseTo(expected, 10);
    });

    it('matches by outcomeLabel when unique condition', () => {
        const position = createMockPosition({
            conditionId: 'cond-1',
            tokenId: 'token-1',
            vote_status: 'Yes',
            shares: 100,
        });
        queryClient.setQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS), {
            pages: [{ data: [position], cursor: null }],
            pageParams: [undefined],
        });

        const result = optimisticSubtractPositionShares(queryClient, {
            proxyAddress: TEST_PROXY_ADDRESS,
            matcher: { conditionId: 'cond-1', outcomeLabel: 'yes' }, // lowercase
            sharesToSubtract: 30,
        });

        expect(result).toBe(true);
        const data = queryClient.getQueryData<PositionsInfiniteData>(getPositionsQueryKey(TEST_PROXY_ADDRESS));
        expect(data?.pages[0]?.data?.[0]?.shares).toBe(70);
    });
});
