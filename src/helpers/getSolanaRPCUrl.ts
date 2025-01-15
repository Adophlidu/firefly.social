import { web3 } from '@coral-xyz/anchor';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';

const SOLANA_DEV_RPC_URL =
    'https://chaotic-solemn-sound.solana-devnet.quiknode.pro/4fc40f8f7d6d57cdc6735ea81a39e07f1fdafc2e';

export function getSolanaRPCUrl() {
    return env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled
        ? SOLANA_DEV_RPC_URL
        : env.external.NEXT_PUBLIC_SOLANA_RPC_URL || web3.clusterApiUrl('mainnet-beta');
}
