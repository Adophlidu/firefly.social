import { getTokenAbiForWagmi } from '@dimensiondev/web3/utils';
import { BigNumber } from 'bignumber.js';
import { type Address, parseUnits } from 'viem';
import type { Config } from 'wagmi';
import { estimateFeesPerGas, getAccount } from 'wagmi/actions';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { isNativeTokenDebank } from '@/helpers/isNativeTokenDebank.js';
import { multipliedBy, toFixed, ZERO } from '@/helpers/number.js';
import type { GetDefaultGasOptions } from '@/providers/types/Transfer.js';

async function estimateGasForErc20Token(
    config: Config,
    to: string,
    token: {
        chainId: number;
        address: string;
        decimals: number;
    },
    amount: string,
) {
    const client = createWagmiPublicClient(token.chainId);
    const account = getAccount(config);
    if (!account.address) throw new Error('Wallet not connected');

    const data = await client.estimateContractGas({
        abi: getTokenAbiForWagmi(token.chainId, token.address as Address),
        functionName: 'transfer',
        address: token.address as Address,
        args: [to as Address, parseUnits(amount, token.decimals)],
        account: account.address,
    });

    return data || 0n;
}

async function estimateGasForNativeToken(
    config: Config,
    to: string,
    token: {
        chainId: number;
        address: string;
        decimals: number;
    },
    amount: string,
) {
    const client = createWagmiPublicClient(token.chainId);
    const data = await client.estimateGas({
        to: to as Address,
        value: parseUnits(amount, token.decimals),
    });

    return data || 0n;
}

export async function getDefaultGas(config: Config, { token, to, amount }: GetDefaultGasOptions<number, Address>) {
    const isEIP1559 = false; // TODO
    const isNative = isNativeTokenDebank(token);
    const parameters = {
        chainId: token.chainId,
        address: token.id,
        decimals: token.decimals,
    };
    const defaultGasLimit = isNative ? 21000n : 50000n;

    // Parallelize fee estimation and gas limit estimation for better performance
    const [feeData, gasLimit] = await Promise.all([
        estimateFeesPerGas(config, {
            chainId: token.chainId,
            type: isEIP1559 ? 'eip1559' : 'legacy',
        }),
        (isNative
            ? estimateGasForNativeToken(config, to, parameters, amount)
            : estimateGasForErc20Token(config, to, parameters, amount)
        ).catch(() => defaultGasLimit),
    ]);
    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = feeData;

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
