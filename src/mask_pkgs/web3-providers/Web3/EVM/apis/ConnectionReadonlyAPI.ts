import { toNumber } from 'lodash-es';

import { EVMRequestReadonly } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/RequestReadonlyAPI.js';
import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';
import { EthereumMethodType, type TransactionReceipt } from '#masknet/web3-shared-evm';

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
