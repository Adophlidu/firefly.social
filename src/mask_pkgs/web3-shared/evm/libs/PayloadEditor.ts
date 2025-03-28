import { first, isUndefined, omitBy } from 'lodash-es';
import { type Hex, hexToNumber } from 'viem';
import type { JsonRpcPayload } from 'web3-core-helpers';

import { parseEthereumChainId } from '@/helpers/parseChainId.js';
import { createJsonRpcPayload } from '@/mask_pkgs/web3-shared/evm/helpers/createJsonRpcPayload.js';
import { isReadonlyMethodType } from '@/mask_pkgs/web3-shared/evm/helpers/isReadonlyMethodType.js';
import { isRiskyMethodType } from '@/mask_pkgs/web3-shared/evm/helpers/isRiskyMethodType.js';
import {
    EthereumMethodType,
    type Transaction,
    type TransactionOptions,
} from '@/mask_pkgs/web3-shared/evm/types/index.js';

type Options = Pick<TransactionOptions, 'account' | 'chainId'>;

export class PayloadEditor {
    constructor(
        private payload: JsonRpcPayload,
        private options?: Options,
    ) {}

    get method() {
        return this.payload.method;
    }

    get params() {
        return this.payload.params ?? [];
    }

    get from(): string | undefined {
        const { method, params } = this.payload;
        switch (method) {
            case EthereumMethodType.ETH_SIGN:
                return first(params);
            case EthereumMethodType.PERSONAL_SIGN:
                return params?.[1];
            case EthereumMethodType.ETH_SIGN_TYPED_DATA:
                return first(params);
            default:
                const config = this.config;
                return config.from;
        }
    }

    get chainId() {
        return this.config.chainId ?? this.options?.chainId;
    }

    private getRawConfig() {
        const { method, params } = this.payload;
        switch (method) {
            case EthereumMethodType.ETH_CALL:
            case EthereumMethodType.ETH_ESTIMATE_GAS:
            case EthereumMethodType.ETH_SIGN_TRANSACTION:
            case EthereumMethodType.ETH_SEND_TRANSACTION:
                return (params as [Transaction])[0];
            default:
                return;
        }
    }

    get config() {
        const raw = this.getRawConfig();

        return omitBy<Transaction>(
            {
                ...raw,
                nonce: parseHexNumber(raw?.nonce),
                from: raw?.from ?? this.options?.account,
                chainId: parseEthereumChainId(raw?.chainId) ?? this.options?.chainId,
            },
            isUndefined,
        );
    }

    get risky() {
        return isRiskyMethodType(this.payload.method as EthereumMethodType);
    }

    get readonly() {
        return isReadonlyMethodType(this.payload.method as EthereumMethodType);
    }

    fill() {
        return this.payload;
    }

    static from<T>(id: number, method: EthereumMethodType, params: T[] = [], options?: Options) {
        return new PayloadEditor(
            createJsonRpcPayload(id, {
                method,
                params,
            }),
            options,
        );
    }

    static fromPayload(payload: JsonRpcPayload, options?: Options) {
        return new PayloadEditor(payload, options);
    }
}

function parseHexNumber(hex: string | number | undefined) {
    return typeof hex !== 'undefined' ? hexToNumber(hex as Hex) : undefined;
}
