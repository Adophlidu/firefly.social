import type { QueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { USDC_E_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';

export function getPolymarketBalanceQueryKey(proxyAddress: Address) {
    return ['multi-chain-token', proxyAddress.toLowerCase(), polygon.id] as const;
}

export function optimisticAddBalance(
    queryClient: QueryClient,
    proxyAddress: Address,
    amountUsd: BigNumber | string | number,
): void {
    const amount = BigNumber(amountUsd);
    if (!amount.isFinite() || amount.lte(0)) return;

    const queryKey = getPolymarketBalanceQueryKey(proxyAddress);
    queryClient.setQueryData<{ tokenAssets?: TokenAsset[] }>(queryKey, (old) => {
        if (!old?.tokenAssets) return old;
        return {
            ...old,
            tokenAssets: old.tokenAssets.map((token) => {
                if (!isSameAddress(token.tokenAddress, USDC_E_POLYGON_ADDRESS)) return token;
                const prevBalance = BigNumber(token.balance ?? 0);
                const nextBalance = prevBalance.plus(amount);
                return { ...token, balance: nextBalance.toString() };
            }),
        };
    });
}

export function optimisticSubtractBalance(
    queryClient: QueryClient,
    proxyAddress: Address,
    amountUsd: BigNumber | string | number,
): void {
    const amount = BigNumber(amountUsd);
    if (!amount.isFinite() || amount.lte(0)) return;

    const queryKey = getPolymarketBalanceQueryKey(proxyAddress);
    queryClient.setQueryData<{ tokenAssets?: TokenAsset[] }>(queryKey, (old) => {
        if (!old?.tokenAssets) return old;
        return {
            ...old,
            tokenAssets: old.tokenAssets.map((token) => {
                if (!isSameAddress(token.tokenAddress, USDC_E_POLYGON_ADDRESS)) return token;
                const prevBalance = BigNumber(token.balance ?? 0);
                const nextBalance = BigNumber.max(0, prevBalance.minus(amount));
                return { ...token, balance: nextBalance.toString() };
            }),
        };
    });
}
