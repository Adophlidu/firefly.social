import { isGreaterThan, isLessThan, leftShift, multipliedBy, rightShift } from '@dimensiondev/web3/numbers';
import { getTokenAbiForWagmi } from '@dimensiondev/web3/utils';
import { type Address, type Hash, parseUnits } from 'viem';
import { getAccount, getBalance, sendTransaction, writeContract } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { getAvailableBalance } from '@/providers/ethereum/getAvailableBalance.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { isNativeTokenDebank } from '@/providers/ethereum/isNativeTokenDebank.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import type { Token, TransactionOptions, TransferProvider } from '@/providers/types/Transfer.js';

class Provider implements TransferProvider<number, Address, Hash> {
    async transfer(options: TransactionOptions<number, Address>): Promise<Address> {
        const { token } = options;
        const account = getAccount(wagmiConfig);
        const currentConnector = account.connector;
        const currentChainId = currentConnector
            ? await currentConnector.getChainId().catch(() => EthereumNetwork.getChainId())
            : EthereumNetwork.getChainId();
        if (!currentChainId || token.chainId !== currentChainId) {
            await switchEthereumChain(token.chainId, {
                config: wagmiConfig,
                connector: currentConnector,
            });
        }

        const hash = this.isNativeToken(token)
            ? await this.transferNative(options)
            : await this.transferContract({ ...options, token });
        return hash;
    }

    isNativeToken(token: Token): boolean {
        return isNativeTokenDebank(token);
    }

    async validateBalance(options: TransactionOptions<number, Address>): Promise<boolean> {
        const balance = await getAvailableBalance(options);
        return !isGreaterThan(rightShift(options.amount, options.token.decimals), balance);
    }

    async validateGas(options: TransactionOptions<number, Address>) {
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

    async getAvailableBalance(options: TransactionOptions<number, Address>): Promise<string> {
        const { token } = options;
        const balance = await getAvailableBalance(options);
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions<number, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas } = await getDefaultGas(options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '1.1').toFixed(0);
        const account = getAccount(wagmiConfig);
        if (!account.address) {
            throw new Error('Wallet not connected');
        }

        const parameters = {
            chainId: options.token.chainId,
            account: account.address,
            to: options.to,
            value: parseUnits(options.amount, options.token.decimals),
            gas: BigInt(gas),
        } as const;

        if (isEIP1559) {
            return sendTransaction(wagmiConfig, {
                ...parameters,
                connector: account.connector,
                type: 'eip1559',
                maxFeePerGas,
            });
        }
        return sendTransaction(wagmiConfig, {
            ...parameters,
            connector: account.connector,
            type: 'legacy',
            gasPrice,
        });
    }

    private async transferContract(options: TransactionOptions<number, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await getDefaultGas(options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '3').toFixed(0);
        const account = getAccount(wagmiConfig);
        if (!account.address) {
            throw new Error('Wallet not connected');
        }

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
                connector: account.connector,
                type: 'eip1559',
                gas: undefined,
                maxFeePerGas,
                maxPriorityFeePerGas,
            });
        }
        return writeContract(wagmiConfig, {
            ...parameters,
            connector: account.connector,
            type: 'legacy',
            gasPrice,
        });
    }

    async waitForTransaction(hash: string, chainId: number): Promise<void> {
        await waitForEthereumTransaction(chainId, hash as Hash);
    }
}

export const EthereumTransfer = new Provider();
