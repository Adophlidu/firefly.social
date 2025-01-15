import { isNativeTokenAddress } from '@masknet/web3-shared-solana';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useNativeToken } from '@/components/RedPacket/hooks/useNativeToken.js';
import { NetworkType } from '@/constants/enum.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isGreaterThan, ZERO } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { type ChainContextOverride, useChainContext } from '@/hooks/useChainContext.js';
import { getNativeTokenBalance, getSplTokenBalance } from '@/providers/solana/getTokenBalance.js';

export function useSolanaAvailableBalance(
    address: string,
    gas: number,
    overrides?: ChainContextOverride,
    enabled = true,
) {
    const isNativeToken = isNativeTokenAddress(address);
    const { chainId, account } = useChainContext(overrides);
    const nativeToken = useNativeToken(chainId, NetworkType.Solana);

    const { data: nativeBalance } = useQuery({
        queryKey: ['solana', 'balance', account],
        enabled,
        queryFn: () => runInSafeAsync(() => getNativeTokenBalance(account, chainId)),
    });

    const { data: balance } = useQuery({
        queryKey: ['solana', 'balance', account, address],
        enabled,
        queryFn: () =>
            runInSafeAsync(async () => {
                if (isNativeToken) {
                    const data = await getNativeTokenBalance(account, chainId);
                    return {
                        amount: data?.value,
                        decimals: nativeToken.decimals,
                        uiAmountString: formatBalance(data.value, nativeToken.decimals),
                    };
                }

                const tokenAccount = await getSplTokenBalance(address, account, chainId);
                return tokenAccount?.tokenAmount;
            }),
    });

    const gasFee = ZERO;

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
    }, [balance, gasFee, nativeBalance, isNativeToken, enabled]);
}
