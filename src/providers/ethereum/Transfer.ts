import { type Address, type Hash, parseUnits } from 'viem';
import { getBalance, sendTransaction, writeContract } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getTokenAbiForWagmi } from '@/helpers/getTokenAbiForWagmi.js';
import { isGreaterThan, isLessThan, leftShift, multipliedBy, rightShift } from '@/helpers/number.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { getAvailableBalance } from '@/providers/ethereum/getAvailableBalance.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { isNativeToken } from '@/providers/ethereum/isNativeToken.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { type Token, type TransactionOptions, type TransferProvider } from '@/providers/types/Transfer.js';
import type { EthereumChainId } from '#masknet/web3-shared-evm';

class Provider implements TransferProvider<EthereumChainId, Address, Hash> {
    async transfer(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { token } = options;
        if (token.chainId !== EthereumNetwork.getChainId()) {
            await switchEthereumChain(token.chainId);
        }

        const hash = this.isNativeToken(token)
            ? await this.transferNative(options)
            : await this.transferContract({ ...options, token });
        return hash;
    }

    isNativeToken(token: Token): boolean {
        return isNativeToken(token);
    }

    async validateBalance(options: TransactionOptions<EthereumChainId, Address>): Promise<boolean> {
        const balance = await getAvailableBalance(options);
        return !isGreaterThan(rightShift(options.amount, options.token.decimals), balance);
    }

    async validateGas(options: TransactionOptions<EthereumChainId, Address>) {
        const { token } = options;
        const account = await EthereumNetwork.getAccount();
        const nativeBalance = await getBalance(wagmiConfig, {
            address: account,
            chainId: token.chainId,
        });
        const { gas } = await getDefaultGas(options);

        return {
            isValid: !isLessThan(`${nativeBalance.value}`, `${gas}`),
            gas,
        };
    }

    async getAvailableBalance(options: TransactionOptions<EthereumChainId, Address>): Promise<string> {
        const { token } = options;
        const balance = await getAvailableBalance(options);
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas } = await getDefaultGas(options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '1.1').toFixed(0);

        const parameters = {
            chainId: options.token.chainId,
            account: await EthereumNetwork.getAccount(),
            to: options.to,
            value: parseUnits(options.amount, options.token.decimals),
            gas: BigInt(gas),
        } as const;

        if (isEIP1559) {
            return sendTransaction(wagmiConfig, {
                ...parameters,
                type: 'eip1559',
                maxFeePerGas,
            });
        }
        return sendTransaction(wagmiConfig, {
            ...parameters,
            type: 'legacy',
            gasPrice,
        });
    }

    private async transferContract(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas } = await getDefaultGas(options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '3').toFixed(0);

        const parameters = {
            chainId: options.token.chainId,
            address: options.token.id,
            abi: getTokenAbiForWagmi(options.token.chainId, options.token.id),
            functionName: 'transfer',
            args: [options.to, parseUnits(options.amount, options.token.decimals)],
            gas: BigInt(gas),
        } as const;

        if (isEIP1559) {
            return writeContract(wagmiConfig, {
                ...parameters,
                type: 'eip1559',
                maxFeePerGas,
            });
        }
        return writeContract(wagmiConfig, {
            ...parameters,
            type: 'legacy',
            gasPrice,
        });
    }

    async waitForTransaction(hash: string, chainId: number): Promise<void> {
        await waitForEthereumTransaction(chainId, hash as Hash);
    }
}

export const EthereumTransfer = new Provider();
