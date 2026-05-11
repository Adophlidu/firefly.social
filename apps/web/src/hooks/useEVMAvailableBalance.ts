'use client';

import { isGreaterThan as isGt, multipliedBy, ZERO } from '@dimensiondev/web3/numbers';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { useMemo } from 'react';
import { useBalance, useEstimateFeesPerGas } from 'wagmi';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { useBalanceOf } from '@/hooks/useBalanceOf.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';

export function useEVMAvailableBalance(
    address: `0x${string}`,
    gas: number,
    overrides?: ChainContextOverrides,
    enabled = true,
) {
    const isNativeToken = isNativeTokenAddress(address);
    const { chainId, isEIP1559, account } = useChainContext(overrides);

    const { data: balance } = useBalanceOf(chainId, account as `0x${string}`, address, enabled);
    const { data: nativeBalance } = useBalance({ address: account as `0x${string}`, chainId });

    const { data } = useEstimateFeesPerGas({
        chainId,
        config: wagmiConfig,
        type: isEIP1559 ? 'eip1559' : 'legacy',
        query: { enabled },
    });
    const { gasPrice, maxFeePerGas } = data ?? {};

    return useMemo(() => {
        if (!balance || !enabled || !nativeBalance) return;
        const gasFee = multipliedBy((isEIP1559 ? maxFeePerGas?.toString() : gasPrice?.toString()) ?? ZERO, gas);

        const insufficientGas = isGt(nativeBalance.value, 0) ? isGt(gasFee, nativeBalance.value) : true;
        if (!isNativeToken)
            return {
                ...balance,
                origin: balance,
                gasFee,
                insufficientGas,
            };
        const result = balance.value - BigInt(gasFee.toNumber());

        return {
            ...balance,
            formatted: result < 0 ? '0' : formatBalance(result.toString(), balance.decimals),
            value: result < 0 ? 0 : result,
            gasFee,
            origin: balance,
            insufficientGas,
        };
    }, [balance, enabled, nativeBalance, isEIP1559, maxFeePerGas, gasPrice, gas, isNativeToken]);
}
