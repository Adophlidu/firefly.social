import { EthereumMethodType } from '#masknet/web3-shared-evm';

export interface MethodItem {
    method: EthereumMethodType;
}

export interface RequestArguments {
    method: string;
    params: unknown[];
}

export interface JsonRpcPayload {
    jsonrpc: string;
    method: string;
    params?: unknown[];
    id?: string | number;
}

export interface JsonRpcResponse<T = unknown> {
    jsonrpc: string;
    id: string | number;
    result?: T;
    error?: {
        readonly code?: number;
        readonly data?: unknown;
        readonly message: string;
    };
}
