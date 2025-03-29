import type { RequestArguments } from '@/mask_pkgs/web3-shared/evm/types/index.js';
import type { JsonRpcPayload } from '@/types/ethereum.js';

export function createJsonRpcPayload(id: number, requestArguments: RequestArguments): JsonRpcPayload {
    return {
        jsonrpc: '2.0',
        id,
        method: requestArguments.method,
        params: requestArguments.params,
    };
}
