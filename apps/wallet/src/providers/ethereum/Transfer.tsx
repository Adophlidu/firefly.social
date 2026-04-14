import { getTokenAbiForWagmi } from '@dimensiondev/web3-utils';
import type { Address, Hash } from 'viem';
import { encodeFunctionData, parseUnits } from 'viem';
import type { Config } from 'wagmi';
import { getAccount, getBalance, getChainId, sendTransaction, writeContract } from 'wagmi/actions';

import { config } from '@/configs/wagmi.js';
import type { EthereumChainId } from '@/constants/ethereum.js';
import { isSupportedStablecoin } from '@/helpers/freeGas/isSupportedStablecoin.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { getBalanceOf } from '@/helpers/getBalanceOf.js';
import { isNativeEvmToken } from '@/helpers/isNativeEvmToken.js';
import { isGreaterThan, isLessThan, leftShift, minus, multipliedBy, rightShift } from '@/helpers/number.js';
import { switchEthereumChain } from '@/helpers/switchEthereumChain.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';
import type { Token, TransactionOptions, TransferProvider } from '@/providers/types/Transfer.js';

export class EthereumTransferProvider implements TransferProvider<EthereumChainId, Address, Hash> {
    constructor(protected config: Config) {}

    async transfer(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { token } = options;
        if (token.chainId !== getChainId(this.config)) {
            await switchEthereumChain(token.chainId);
        }

        const hash = this.isNativeToken(token)
            ? await this.transferNative(options)
            : await this.transferContract({ ...options, token });
        return hash;
    }

    isNativeToken(token: Pick<Token, 'id' | 'chainId'>): boolean {
        return isNativeEvmToken(token);
    }

    async validateBalance(options: TransactionOptions<EthereumChainId, Address>): Promise<boolean> {
        const balance = await this.getAvailableBalance(options);
        return !isGreaterThan(rightShift(options.amount, options.token.decimals), balance);
    }

    async validateGas(options: TransactionOptions<EthereumChainId, Address>) {
        const { token } = options;
        const account = getAccount(this.config);
        if (!account.address) {
            throw new Error('Wallet not connected');
        }
        // Parallelize balance and gas estimation for better performance
        const [nativeBalance, { gas }] = await Promise.all([
            getBalance(this.config, {
                address: account.address,
                chainId: token.chainId,
            }),
            getDefaultGas(this.config, options),
        ]);

        return {
            isValid: !isLessThan(`${nativeBalance.value}`, `${gas}`),
            gas,
        };
    }

    async getAvailableBalance(options: TransactionOptions<EthereumChainId, Address>): Promise<string> {
        const { token } = options;
        const account = getAccount(this.config);
        if (!account.address) {
            throw new Error('Wallet not connected');
        }
        const rawBalance = await getBalanceOf(token.chainId, account.address, token.id);
        let balance = rawBalance.value.toString();
        if (this.isNativeToken(token)) {
            try {
                const { gas } = await getDefaultGas(this.config, options);
                const available = minus(rawBalance.value.toString(), gas);
                balance = isLessThan(available, 0) ? '0' : available.toString();
            } catch {
                // gas estimation failed, use raw balance without gas deduction
            }
        }
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas } = await getDefaultGas(this.config, options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '1.1').toFixed(0);
        const account = getAccount(this.config);
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
            return sendTransaction(this.config, {
                ...parameters,
                connector: options.connector,
                type: 'eip1559',
                maxFeePerGas,
            });
        }
        return sendTransaction(this.config, {
            ...parameters,
            connector: options.connector,
            type: 'legacy',
            gasPrice,
        });
    }

    private async transferContract(options: TransactionOptions<EthereumChainId, Address>): Promise<Address> {
        const { isEIP1559, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await getDefaultGas(this.config, options);
        const gas = multipliedBy((this.isNativeToken(options.token) ? 21000n : 50000n).toString(), '3').toFixed(0);

        const account = getAccount(this.config);
        if (!account.address) throw new Error('Wallet not connected');

        const amount = parseUnits(options.amount, options.token.decimals);

        // Try free-gas for stablecoin transfers
        if (isSupportedStablecoin(options.token.chainId, options.token.id)) {
            const abi = getTokenAbiForWagmi(options.token.chainId, options.token.id);
            const calldata = encodeFunctionData({
                abi,
                functionName: 'transfer',
                args: [options.to, amount],
            });
            const result = await tryFreeGasTransaction({
                chainId: options.token.chainId,
                txType: FreeGasTxType.TokenTransfer,
                from: account.address,
                to: options.token.id,
                data: calldata,
            });
            if (result.type === 'free-gas') return result.hash as Address;
        }

        const parameters = {
            chainId: options.token.chainId,
            address: options.token.id,
            abi: getTokenAbiForWagmi(options.token.chainId, options.token.id),
            functionName: 'transfer',
            args: [options.to, amount],
            gas: BigInt(gas),
        } as const;

        if (isEIP1559) {
            return writeContract(this.config, {
                ...parameters,
                connector: options.connector,
                type: 'eip1559',
                gas: undefined,
                maxFeePerGas,
                maxPriorityFeePerGas,
            });
        }
        return writeContract(this.config, {
            ...parameters,
            connector: options.connector,
            type: 'legacy',
            gasPrice,
        });
    }

    async waitForTransaction(hash: string, chainId: number): Promise<void> {
        await waitForEthereumTransaction(chainId, hash as Hash);
    }
}

export const EthereumTransfer = new EthereumTransferProvider(config);
