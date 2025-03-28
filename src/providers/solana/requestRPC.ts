import { SolanaChainId } from '@masknet/web3-shared-solana';

import { RPC_Error } from '@/constants/error.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';

interface RpcOptions {
    method: string;
    params?: unknown[];
}

export async function requestRPC<T = unknown>(chainId: SolanaChainId, options: RpcOptions): Promise<T> {
    const response = await fetchJSON<T & { error: unknown; message?: string }>(getSolanaRPCUrl(), {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
            ...options,
            jsonrpc: '2.0',
            id: 0,
        }),
    });

    if (response.error) throw new RPC_Error(response.message || 'Fails in requesting RPC');
    return response as T;
}
