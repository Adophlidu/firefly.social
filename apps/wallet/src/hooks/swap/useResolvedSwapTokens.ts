import { isNativeTokenOrSameAddress } from '@dimensiondev/web3-utils';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { useSwapTokenDetail } from '@/hooks/swap/useSwapTokenDetail.js';
import { type DefaultSwapTokenPair, getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
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
    if (isNativeTokenOrSameAddress(address, defaults.first.contractAddress)) {
        return createFallbackToken(defaults, 'first');
    }
    if (isNativeTokenOrSameAddress(address, defaults.second.contractAddress)) {
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

    const { data: fromTokenDetail } = useSwapTokenDetail({ address: resolvedFromAddress, chainId: resolvedFromChain });
    const { data: toTokenDetail } = useSwapTokenDetail({ address: resolvedToAddress, chainId: resolvedToChain });

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
