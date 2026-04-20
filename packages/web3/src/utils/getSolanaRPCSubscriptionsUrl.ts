import { getSolanaRPCUrl } from '@/utils/getSolanaRPCUrl.js';

function toWebSocketUrl(rpcUrl: string) {
    try {
        const url = new URL(rpcUrl);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return url.toString();
    } catch {
        return rpcUrl.replace(/^http/i, 'ws');
    }
}

export interface GetSolanaRPCSubscriptionsUrlParams {
    /** Prefer this WebSocket RPC when set (e.g. `NEXT_PUBLIC_SOLANA_RPC_WS_URL`). */
    wsUrl?: string | null | undefined;
    /** HTTP RPC used to derive a `ws(s):` URL when `wsUrl` is absent (e.g. `NEXT_PUBLIC_SOLANA_RPC_URL`). */
    httpUrl?: string | null | undefined;
}

export function getSolanaRPCSubscriptionsUrl(params: GetSolanaRPCSubscriptionsUrlParams): string {
    return params.wsUrl || toWebSocketUrl(getSolanaRPCUrl({ httpUrl: params.httpUrl }));
}
