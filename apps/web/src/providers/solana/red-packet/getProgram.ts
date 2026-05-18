import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { solana, solanaDevnet } from '@dimensiondev/web3/chains';

import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';

/**
 * @param forcePrivy - Force using privy wallet to claim
 */
export function getProgram(forcePrivy = false) {
    return createRedPacketProgram(
        envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? solanaDevnet.id : solana.id,
        true,
        forcePrivy,
    );
}
