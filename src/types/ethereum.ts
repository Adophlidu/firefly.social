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
    params?: any[];
    id?: string | number;
}

export interface JsonRpcResponse {
    jsonrpc: string;
    id: string | number;
    result?: any;
    error?: {
        readonly code?: number;
        readonly data?: unknown;
        readonly message: string;
    };
}
