import { web3 } from '@coral-xyz/anchor';

import { env } from '@/constants/env.js';

export function getSolanaRPCUrl() {
    return env.external.NEXT_PUBLIC_SOLANA_RPC_URL || web3.clusterApiUrl('mainnet-beta');
}
