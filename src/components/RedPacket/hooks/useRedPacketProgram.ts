/* cspell:disable */

import type { ChainId } from '@masknet/web3-shared-solana';
import { useMemo } from 'react';

import { createRedPacketProgram } from '@/programs/index.js';

export function useRedPacketProgram(chainId: ChainId) {
    return useMemo(() => {
        return createRedPacketProgram(chainId);
    }, [chainId]);
}
