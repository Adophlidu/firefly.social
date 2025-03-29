import { sha256, toHex } from 'viem';
import type { TransactionConfig } from 'web3-core';

import { EthereumMethodType, type RequestArguments } from '@/mask_pkgs/web3-shared/evm/types/index.js';
import type { JsonRpcPayload } from '@/types/ethereum.js';

const toId = (...keys: Array<string | boolean>) => sha256(toHex(keys.join(',')));

export class RequestID {
    /**
     * @deprecated Don't new RequestID()
     * Use RequestID.from(requestArguments) stead.
     */
    constructor(
        private url: string,
        private requestArguments: RequestArguments,
    ) {}

    get ID() {
        const { method, params } = this.requestArguments;
        switch (method) {
            case EthereumMethodType.ETH_GET_CODE: {
                const [address, tag = 'latest'] = params as [string, string];
                return toId(this.url, method, address, tag);
            }
            case EthereumMethodType.ETH_BLOCK_NUMBER: {
                return toId(this.url, method);
            }
            case EthereumMethodType.ETH_GET_BLOCK_BY_NUMBER: {
                const [number, full] = params as [string, boolean];
                return toId(this.url, method, number, full);
            }
            case EthereumMethodType.ETH_GET_BLOCK_BY_HASH: {
                const [hash] = params as [string];
                return toId(this.url, method, hash);
            }
            case EthereumMethodType.ETH_GAS_PRICE: {
                return toId(this.url, method);
            }
            case EthereumMethodType.ETH_GET_BALANCE: {
                const [account, tag = 'latest'] = params as [string, string];
                return toId(this.url, method, account, tag);
            }
            case EthereumMethodType.ETH_GET_TRANSACTION_COUNT: {
                const [account, tag = 'latest'] = params as [string, string];
                return toId(this.url, method, account, tag);
            }
            case EthereumMethodType.ETH_CALL: {
                const [config, tag = 'latest'] = params as [TransactionConfig, string];
                return toId(this.url, method, JSON.stringify(config), tag);
            }
            case EthereumMethodType.ETH_ESTIMATE_GAS: {
                const [config, tag = 'latest'] = params as [TransactionConfig, string];
                return toId(this.url, method, JSON.stringify(config), tag);
            }
            case EthereumMethodType.ETH_GET_TRANSACTION_RECEIPT: {
                const [hash] = params as [string];
                return toId(this.url, method, hash);
            }
            case EthereumMethodType.ETH_GET_TRANSACTION_BY_HASH:
                const [hash] = params as [string];
                return toId(this.url, method, hash);
            default:
                return;
        }
    }

    static from(url: string, requestArguments: RequestArguments) {
        return new RequestID(url, requestArguments);
    }

    static fromPayload(url: string, payload: JsonRpcPayload) {
        return new RequestID(url, {
            method: payload.method as EthereumMethodType,
            params: payload.params ?? [],
        });
    }
}
