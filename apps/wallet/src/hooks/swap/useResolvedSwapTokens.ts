import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { chainsMatch } from '@/helpers/isSolanaChain.js';
import { addressesMatch } from '@/helpers/swap/formatSwapAmount.js';
import { type DefaultSwapTokenPair, getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { fromAddressAtom, fromChainIdAtom, toAddressAtom, toChainIdAtom } from '@/store/swap/swapState.js';

// Create a minimal SwapToken from default config when API tokens aren't available yet
function createFallbackToken(defaults: DefaultSwapTokenPair, side: 'first' | 'second'): SwapToken {
    const token = defaults[side];
    return {
        address: token.contractAddress,
        symbol: token.symbol,
        name: token.symbol,
        decimals: token.decimals,
        chainId: defaults.chainId,
    };
}

// Find a default token that matches the given address
function findDefaultFallback(defaults: DefaultSwapTokenPair | undefined, address: string): SwapToken | null {
    if (!defaults) return null;
    if (addressesMatch(address, defaults.first.contractAddress)) {
        return createFallbackToken(defaults, 'first');
    }
    if (addressesMatch(address, defaults.second.contractAddress)) {
        return createFallbackToken(defaults, 'second');
    }
    return null;
}

export interface ResolvedSwapTokens {
    fromToken: SwapToken | null;
    toToken: SwapToken | null;
    resolvedFromChain: number;
    resolvedToChain: number;
}

export function useResolvedSwapTokens(): ResolvedSwapTokens {
    const fromAddress = useAtomValue(fromAddressAtom);
    const toAddress = useAtomValue(toAddressAtom);
    const fromChainId = useAtomValue(fromChainIdAtom);
    const toChainId = useAtomValue(toChainIdAtom);

    const resolvedFromChain = fromChainId ?? 1;
    const resolvedToChain = toChainId ?? 1; // Default to Ethereum, independent of fromChain
    const fromDefaults = getDefaultSwapToken(resolvedFromChain);
    const toDefaults = getDefaultSwapToken(resolvedToChain);
    const resolvedFromAddress = fromAddress ?? fromDefaults?.first.contractAddress;
    const resolvedToAddress = toAddress ?? toDefaults?.second.contractAddress;

    const { data: fromTokenDetail } = useQuery({
        queryKey: ['swap-token-detail', resolvedFromAddress, resolvedFromChain],
        queryFn: async () => {
            if (!resolvedFromAddress) return null;
            const endpoint = createSwapEndpoint();
            const results = await endpoint.getTokenDetailBatch([
                { chainId: String(resolvedFromChain), address: resolvedFromAddress },
            ]);
            return (
                results.find((t) => {
                    return chainsMatch(t.chainId, resolvedFromChain) && addressesMatch(t.address, resolvedFromAddress);
                }) ?? null
            );
        },
        enabled: !!resolvedFromAddress,
        staleTime: 30 * 60 * 1000,
    });

    const { data: toTokenDetail } = useQuery({
        queryKey: ['swap-token-detail', resolvedToAddress, resolvedToChain],
        queryFn: async () => {
            if (!resolvedToAddress) return null;
            const endpoint = createSwapEndpoint();
            const results = await endpoint.getTokenDetailBatch([
                { chainId: String(resolvedToChain), address: resolvedToAddress },
            ]);
            return (
                results.find((t) => {
                    return chainsMatch(t.chainId, resolvedToChain) && addressesMatch(t.address, resolvedToAddress);
                }) ?? null
            );
        },
        enabled: !!resolvedToAddress,
        staleTime: 30 * 60 * 1000,
    });

    const fromToken = useMemo(() => {
        if (!resolvedFromAddress) return null;
        return fromTokenDetail ?? findDefaultFallback(fromDefaults, resolvedFromAddress);
    }, [fromTokenDetail, resolvedFromAddress, fromDefaults]);

    const toToken = useMemo(() => {
        if (!resolvedToAddress) return null;
        return toTokenDetail ?? findDefaultFallback(toDefaults, resolvedToAddress);
    }, [toTokenDetail, resolvedToAddress, toDefaults]);

    return { fromToken, toToken, resolvedFromChain, resolvedToChain };
}
