'use client';

import { useMemo } from 'react';
import { useEstimateFeesPerGas } from 'wagmi';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { isGreaterThan, multipliedBy, ZERO } from '@/helpers/number.js';
import { useBalanceOf } from '@/hooks/useBalanceOf.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';

export function useEVMAvailableBalance(
    address: `0x${string}`,
    gas: number,
    overrides?: ChainContextOverrides,
    enabled = true,
) {
    const isNativeToken = isZeroAddressEthereum(address);
    const { chainId, isEIP1559, account } = useChainContext(overrides);

    const { data: balance } = useBalanceOf(chainId, account as `0x${string}`, address, enabled);

    const { data } = useEstimateFeesPerGas({
        chainId,
        config: wagmiConfig,
        type: isEIP1559 ? 'eip1559' : 'legacy',
        query: { enabled },
    });
    const { gasPrice, maxFeePerGas } = data ?? {};

    return useMemo(() => {
        if (!balance || !enabled) return;
        const gasFee = multipliedBy((isEIP1559 ? maxFeePerGas?.toString() : gasPrice?.toString()) ?? ZERO, gas);

        if (!isNativeToken)
            return {
                ...balance,
                origin: balance,
                gasFee,
                insufficientGas: isGreaterThan(gasFee, balance?.value.toString() ?? 0),
            };

        const result = balance.value - BigInt(gasFee.toNumber());
        return {
            ...balance,
            formatted: result < 0 ? '0' : formatBalance(result.toString(), balance.decimals),
            value: result < 0 ? 0 : result,
            gasFee,
            origin: balance,
            insufficientGas: result < 0,
        };
    }, [isNativeToken, balance, isEIP1559, gas, gasPrice, maxFeePerGas, balance?.value, enabled]);
}
