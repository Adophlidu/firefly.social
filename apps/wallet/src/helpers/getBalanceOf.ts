import { isZeroAddress } from '@dimensiondev/web3/utils';
import { type Address, erc20Abi } from 'viem';
import { getBalance, multicall } from 'wagmi/actions';

import { config } from '@/configs/wagmi.js';

export async function getBalanceOf(chainId: number, account: string, address?: string) {
    const chainId_ = chainId as (typeof config)['chains'][number]['id'];

    if (!address || isZeroAddress(address)) {
        const balance = await getBalance(config, {
            chainId: chainId_,
            address: account as Address,
            blockTag: 'latest',
        });
        return balance;
    }

    // Use multicall to fetch both balanceOf and decimals
    const [balanceResult, decimalsResult, symbolResult] = await multicall(config, {
        chainId: chainId_,
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
