import { env } from '@/constants/env.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';

function toWebSocketUrl(rpcUrl: string) {
    try {
        const url = new URL(rpcUrl);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return url.toString();
    } catch {
        return rpcUrl.replace(/^http/i, 'ws');
    }
}

export function getSolanaRPCSubscriptionsUrl() {
    return env.external.NEXT_PUBLIC_SOLANA_RPC_WS_URL || toWebSocketUrl(getSolanaRPCUrl());
}
