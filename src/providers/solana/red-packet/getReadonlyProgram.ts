import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function getReadonlyProgram() {
    return createRedPacketProgram(
        env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? SolanaChainId.Devnet : SolanaChainId.Mainnet,
    );
}
