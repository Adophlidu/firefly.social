import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';

import { RPC_Error } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';

interface RpcOptions {
    method: string;
    params?: unknown[];
}

export async function requestRPC<T = unknown>(chainId: number, options: RpcOptions): Promise<T> {
    const response = await fetchJson<T & { error: unknown; message?: string }>(
        getSolanaRPCUrl({
            useDevCluster: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled,
            httpUrl: envs.external.NEXT_PUBLIC_SOLANA_RPC_URL,
        }),
        {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                ...options,
                jsonrpc: '2.0',
                id: 0,
            }),
        },
    );

    if (response.error) throw new RPC_Error(response.message || 'Fails in requesting RPC');
    return response as T;
}
