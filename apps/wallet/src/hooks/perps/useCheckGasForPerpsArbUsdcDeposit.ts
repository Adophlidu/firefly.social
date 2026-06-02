import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { type Address, erc20Abi, parseUnits } from 'viem';

import {
    ARBITRUM_CHAIN_ID,
    ARBITRUM_USDC_ADDRESS,
    ARBITRUM_USDC_DECIMALS,
    HYPERLIQUID_DEPOSIT_ADDRESS,
} from '@/constants/hyperliquid.js';
import { checkFreeGasEligibility } from '@/helpers/freeGas/checkFreeGasEligibility.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';

interface Params {
    amount: string;
    walletAddress: string | null | undefined;
    enabled?: boolean;
}

export function useCheckGasForPerpsArbUsdcDeposit({ amount, walletAddress, enabled = true }: Params) {
    const chainId = ARBITRUM_CHAIN_ID;
    const embedded = walletAddress ?? null;

    const amountPositive = useMemo(() => {
        const bn = new BigNumber(amount || '0');
        return bn.isFinite() && bn.gt(0);
    }, [amount]);

    const { data: feeInfo, isLoading: isEstimatingGas } = useQuery({
        queryKey: ['perps-deposit-gas-fee', embedded, amount],
        staleTime: 60_000,
        enabled: enabled && Boolean(embedded && amountPositive),
        queryFn: async () => {
            const parsedValue = parseUnits(amount, ARBITRUM_USDC_DECIMALS);
            const client = createWagmiPublicClient(chainId, resolvePublicRpcUrl(chainId));
            const estimated = await client.estimateContractGas({
                address: ARBITRUM_USDC_ADDRESS,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [HYPERLIQUID_DEPOSIT_ADDRESS, parsedValue],
                account: embedded as Address,
            });
            const gasLimit = (estimated * 120n) / 100n;
            const [gasPrice, nativeBalanceWei] = await Promise.all([
                client.getGasPrice(),
                client.getBalance({ address: embedded as Address }),
            ]);
            const feeWei = gasLimit * gasPrice;
            return { nativeBalanceWei, feeWei };
        },
    });

    const hasEnoughEth = feeInfo ? feeInfo.nativeBalanceWei >= feeInfo.feeWei : true;

    const { data: freeGasEligible, isLoading: isFreeGasLoading } = useQuery({
        queryKey: ['perps-deposit-free-gas-check', chainId, embedded],
        enabled: Boolean(feeInfo && !hasEnoughEth),
        staleTime: 60_000,
        retry: 0,
        queryFn: async () => {
            return checkFreeGasEligibility({
                chainId,
                txType: FreeGasTxType.TokenTransfer,
                to: ARBITRUM_USDC_ADDRESS,
            });
        },
    });

    const isInsufficient = Boolean(feeInfo && !hasEnoughEth) && freeGasEligible === false;

    return {
        isLoading: isEstimatingGas || (Boolean(feeInfo && !hasEnoughEth) && isFreeGasLoading),
        isInsufficientGas: isInsufficient,
    };
}
