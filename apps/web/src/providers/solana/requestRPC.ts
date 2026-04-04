import { RPC_Error } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { type SolanaChainId } from '@/web3-shared/solana/types.js';

interface RpcOptions {
    method: string;
    params?: unknown[];
}

export async function requestRPC<T = unknown>(chainId: SolanaChainId, options: RpcOptions): Promise<T> {
    const response = await fetchJson<T & { error: unknown; message?: string }>(getSolanaRPCUrl(), {
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
