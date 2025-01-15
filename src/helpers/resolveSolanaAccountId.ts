import { SOLANA_PREFIX } from '@/constants/rp.js';

export function resolveSolanaAccountId(rpId: string, accountId?: string) {
    return accountId || rpId.startsWith(SOLANA_PREFIX) ? rpId.replace(SOLANA_PREFIX, '') : null;
}
