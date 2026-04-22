import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { multipliedBy, toFixed, ZERO } from '@dimensiondev/web3/numbers';
import { EthChainResolver } from '@dimensiondev/web3/resolvers';
import { getTokenAbiForWagmi, resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { BigNumber } from 'bignumber.js';
import { type Address, parseUnits } from 'viem';
import { estimateFeesPerGas } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { isNativeTokenDebank } from '@/providers/ethereum/isNativeTokenDebank.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import type { GetDefaultGasOptions } from '@/providers/types/Transfer.js';

async function estimateGasForErc20Token(
    to: string,
    token: {
        chainId: number;
        address: string;
        decimals: number;
    },
    amount: string,
) {
    const client = createWagmiPublicClient(token.chainId, resolvePublicRpcUrl(token.chainId));
    const account = await EthereumNetwork.getAccount();
    const data = await client.estimateContractGas({
        abi: getTokenAbiForWagmi(token.chainId, token.address as Address),
        functionName: 'transfer',
        address: token.address as Address,
        args: [to as Address, parseUnits(amount, token.decimals)],
        account,
    });

    return data || 0n;
}

async function estimateGasForNativeToken(
    to: string,
    token: {
        chainId: number;
        address: string;
        decimals: number;
    },
    amount: string,
) {
    const client = createWagmiPublicClient(token.chainId, resolvePublicRpcUrl(token.chainId));
    const data = await client.estimateGas({
        to: to as Address,
        value: parseUnits(amount, token.decimals),
    });

    return data || 0n;
}

export async function getDefaultGas({ token, to, amount }: GetDefaultGasOptions<number, Address>) {
    const isEIP1559 = EthChainResolver.isFeatureSupported(token.chainId, 'EIP1559');
    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(wagmiConfig, {
        chainId: token.chainId,
        type: isEIP1559 ? 'eip1559' : 'legacy',
    });
    const isNative = isNativeTokenDebank(token);
    const parameters = { chainId: token.chainId, address: token.id, decimals: token.decimals };
    let gasLimit: bigint;
    try {
        gasLimit = isNative
            ? await estimateGasForNativeToken(to, parameters, amount)
            : await estimateGasForErc20Token(to, parameters, amount);
    } catch {
        // Fallback to default gas limit
        gasLimit = isNative ? 21000n : 50000n;
    }

    const gasFee = isEIP1559
        ? !maxFeePerGas
            ? ZERO
            : multipliedBy(maxFeePerGas.toString(), gasLimit.toString())
        : !gasPrice
          ? ZERO
          : multipliedBy(gasPrice.toString(), gasLimit.toString());

    return {
        gas: BigNumber(toFixed(multipliedBy(gasFee, '1.3'))),
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasPrice,
        gasLimit,
        isEIP1559,
    };
}
