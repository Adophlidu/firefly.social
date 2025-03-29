import type { JsonRpcResponse } from '@/types/ethereum.js';

export function createJsonRpcResponse<T>(id: number, result?: T, error?: Error): JsonRpcResponse {
    return {
        jsonrpc: '2.0',
        id,
        result,
        error,
    };
}
