import { toNumber } from 'lodash-es';
import { type TransactionReceipt, EthereumMethodType } from '@masknet/web3-shared-evm';
import { EVMRequestReadonly } from './RequestReadonlyAPI.js';
import type { EVMConnectionOptions } from '../types/index.js';

export class EVMConnectionReadonlyAPI {
    protected Request = EVMRequestReadonly;
    // protected Contract = EVMContractReadonly;

    getWeb3(initial?: EVMConnectionOptions) {
        return this.Request.getWeb3(initial);
    }

    getTransactionReceipt(hash: string, initial?: EVMConnectionOptions) {
        return this.Request.request<TransactionReceipt>(
            {
                method: EthereumMethodType.ETH_GET_TRANSACTION_RECEIPT,
                params: [hash],
            },
            initial,
        );
    }

    async getTransactionNonce(address: string, initial?: EVMConnectionOptions) {
        const nonce = await this.Request.request<number | string>(
            {
                method: EthereumMethodType.ETH_GET_TRANSACTION_COUNT,
                params: [address, 'latest'],
            },
            initial,
        );
        return toNumber(nonce);
    }
}

export const EVMWeb3Readonly = new EVMConnectionReadonlyAPI();
