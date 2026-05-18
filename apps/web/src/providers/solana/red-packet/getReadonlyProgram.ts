import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { solana, solanaDevnet } from '@dimensiondev/web3/chains';

import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';

export function getReadonlyProgram() {
    return createRedPacketProgram(
        envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? solanaDevnet.id : solana.id,
    );
}
