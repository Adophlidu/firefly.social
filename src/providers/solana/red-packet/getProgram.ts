import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

/**
 * @param forcePrivy - Force using privy wallet to claim
 */
export function getProgram(forcePrivy = false) {
    return createRedPacketProgram(
        env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? SolanaChainId.Devnet : SolanaChainId.Mainnet,
        true,
        forcePrivy,
    );
}
