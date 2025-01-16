import { SOLANA_PREFIX } from '@/constants/rp.js';

export function resolveSolanaAccountId(rpId: string, accountId?: string) {
    return accountId || rpId.replace(SOLANA_PREFIX, '');
}
