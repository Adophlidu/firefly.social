import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import type { Config } from 'wagmi';
import { getBalance, multicall } from 'wagmi/actions';

import { isZeroAddress } from '@/utils/isZeroAddress.js';

export async function getBalanceOf(config: Config, chainId: number, account: string, address?: string) {
    if (!address || isZeroAddress(address)) {
        return getBalance(config, {
            chainId,
            address: account as Address,
            blockTag: 'latest',
        });
    }

    const [balanceResult, decimalsResult, symbolResult] = await multicall(config, {
        chainId,
        contracts: [
            {
                abi: erc20Abi,
                address: address as Address,
                functionName: 'balanceOf',
                args: [account as Address],
            },
            {
                abi: erc20Abi,
                address: address as Address,
                functionName: 'decimals',
            },
            {
                abi: erc20Abi,
                address: address as Address,
                functionName: 'symbol',
            },
        ],
    });

    if (
        balanceResult.status !== 'success' ||
        decimalsResult.status !== 'success' ||
        symbolResult.status !== 'success'
    ) {
        throw new Error(
            `Failed to fetch token balance or decimals for account=${account} address=${address} on chain: ${chainId}`,
        );
    }

    return {
        value: balanceResult.result,
        decimals: decimalsResult.result,
        symbol: symbolResult.result,
    };
}
