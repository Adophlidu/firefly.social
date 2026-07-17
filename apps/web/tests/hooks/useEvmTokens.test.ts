/// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { useEvmTokens } from '@/hooks/useEvmTokens.js';
import { getMultiChainTokenList } from '@/providers/firefly/endpoint/getMultiChainTokenList.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';

vi.mock('@/providers/firefly/endpoint/getMultiChainTokenList.js', () => ({
    getMultiChainTokenList: vi.fn(),
}));
vi.mock('@/hooks/useCustomFungibleTokens.js', () => ({
    useCustomFungibleTokens: vi.fn(),
}));

const fetchTokens = vi.mocked(getMultiChainTokenList);
const useCustom = vi.mocked(useCustomFungibleTokens);

function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

function asset(over: Partial<TokenAsset> & { chainIndex: string; tokenAddress: string }): TokenAsset {
    return {
        name: over.symbol ?? 'T',
        symbol: 'T',
        decimals: '18',
        tokenLogoUrl: '',
        address: '0x0000000000000000000000000000000000000001',
        balance: '1',
        tokenPrice: '1',
        tokenType: '1',
        isRiskToken: false,
        ...over,
    } as TokenAsset;
}

beforeEach(() => {
    fetchTokens.mockReset();
    useCustom.mockReturnValue([]);
});

describe('useEvmTokens (FW-7873)', () => {
    // The picker must read from the same muti-chain (OKX) source as the wallet home so
    // the token universe never diverges between the two surfaces.
    it('uses the muti-chain source and passes the caller chainIds through', async () => {
        fetchTokens.mockResolvedValue([]);
        renderHook(() => useEvmTokens('0xABC', [1, 56]), { wrapper: createWrapper() });
        await waitFor(() => expect(fetchTokens).toHaveBeenCalledWith(['0xABC'], [1, 56]));
    });

    // Mirrors iOS RedPacketCreatDataProvider: drop only hide===true. Zero-value tokens
    // must NOT be dropped (the previous Debank-source impl dropped usdValue===0, which
    // hid tokens the wallet showed).
    it('drops only hide===true tokens and keeps zero-value tokens', async () => {
        fetchTokens.mockResolvedValue([
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'a'.repeat(40)}`,
                symbol: 'KEEP',
                tokenPrice: '0',
                balance: '5',
            }),
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'b'.repeat(40)}`,
                symbol: 'HIDE',
                tokenPrice: '10',
                balance: '2',
                hide: true,
            }),
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'c'.repeat(40)}`,
                symbol: 'ZERO',
                tokenPrice: '0',
                balance: '9',
            }),
        ]);
        const { result } = renderHook(() => useEvmTokens('0xabc', [1]), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.tokens.length).toBe(2));
        expect(result.current.tokens.map((t) => t.symbol).sort()).toEqual(['KEEP', 'ZERO']);
    });

    it('sorts by usdValue descending', async () => {
        fetchTokens.mockResolvedValue([
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'a'.repeat(40)}`,
                symbol: 'SMALL',
                tokenPrice: '0.5',
                balance: '1',
            }),
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'b'.repeat(40)}`,
                symbol: 'BIG',
                tokenPrice: '100',
                balance: '2',
            }),
        ]);
        const { result } = renderHook(() => useEvmTokens('0xabc', [1]), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.tokens.length).toBe(2));
        expect(result.current.tokens.map((t) => t.symbol)).toEqual(['BIG', 'SMALL']);
    });

    it('clamps the returned set to the caller chainIds', async () => {
        fetchTokens.mockResolvedValue([
            asset({
                chainIndex: '1',
                tokenAddress: `0x${'a'.repeat(40)}`,
                symbol: 'ETH_TKN',
                tokenPrice: '1',
                balance: '1',
            }),
            asset({
                chainIndex: '56',
                tokenAddress: `0x${'b'.repeat(40)}`,
                symbol: 'BSC_TKN',
                tokenPrice: '1',
                balance: '1',
            }),
        ]);
        const { result } = renderHook(() => useEvmTokens('0xabc', [1]), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.tokens.length).toBe(1));
        expect(result.current.tokens[0].symbol).toBe('ETH_TKN');
    });
});
