import { useQuery } from '@tanstack/react-query';
import type BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { isGreaterThan } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { getNativeTokenBalance, getSplTokenBalance } from '@/providers/solana/getTokenBalance.js';
import { SolanaChainResolver } from '@/web3-providers/solana/ResolverAPI.js';

export function useSolanaAvailableBalance(
    address: string,
    gasFee: BigNumber,
    overrides?: ChainContextOverrides,
    enabled = true,
) {
    const isNativeToken = isZeroAddressSolana(address);
    const { chainId, account } = useChainContext(overrides);

    const { data } = useQuery({
        queryKey: ['solana', 'balance', account?.toLowerCase(), address?.toLowerCase()],
        enabled,
        staleTime: STALE_TIMES.MINUTE_1,

        queryFn: async () => {
            const nativeBalance = await runInSafeAsync(() => getNativeTokenBalance(account, chainId));
            if (isNativeToken) {
                const nativeToken = SolanaChainResolver.nativeCurrency(chainId);
                return {
                    balance: {
                        amount: nativeBalance?.value,
                        decimals: nativeToken.decimals,
                        uiAmountString: formatBalance(nativeBalance?.value || '0', nativeToken.decimals),
                    },
                    nativeBalance,
                };
            }

            const tokenAccount = await runInSafeAsync(() => getSplTokenBalance(address, account, chainId));
            return {
                balance: tokenAccount?.tokenAmount,
                nativeBalance,
            };
        },
    });
    const { balance, nativeBalance } = data || {};

    return useMemo(() => {
        if (!balance || !enabled) return;

        const origin = {
            decimals: balance.decimals,
            formatted: balance.uiAmountString ?? '0',
            symbol: '',
            value: balance.amount ? BigInt(balance.amount) : 0n,
        };
        if (isNativeToken) {
            const result = origin.value - BigInt(gasFee.toNumber());
            return {
                ...origin,
                formatted: result < 0 ? '0' : origin.formatted,
                value: result < 0 ? 0n : result,
                origin,
                gasFee,
                insufficientGas: result < 0,
            };
        }
        return {
            ...origin,
            origin,
            gasFee,
            insufficientGas: isGreaterThan(gasFee, nativeBalance?.value ?? '0'),
        };
    }, [balance, enabled, isNativeToken, gasFee, nativeBalance?.value]);
}
