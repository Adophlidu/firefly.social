import { envs, STATUS } from '@dimensiondev/envs';

import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function getReadonlyProgram() {
    return createRedPacketProgram(
        envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? SolanaChainId.Devnet : SolanaChainId.Mainnet,
    );
}
