import { web3 } from '@coral-xyz/anchor';
import { envs, STATUS } from '@dimensiondev/envs';

const SOLANA_DEV_RPC_URL =
    'https://chaotic-solemn-sound.solana-devnet.quiknode.pro/4fc40f8f7d6d57cdc6735ea81a39e07f1fdafc2e';

export function getSolanaRPCUrl() {
    return envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled
        ? SOLANA_DEV_RPC_URL
        : envs.external.NEXT_PUBLIC_SOLANA_RPC_URL || web3.clusterApiUrl('mainnet-beta');
}
