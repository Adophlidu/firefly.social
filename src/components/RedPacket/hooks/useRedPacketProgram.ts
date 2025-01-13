/* cspell:disable */

import type { ChainId } from '@masknet/web3-shared-solana';
import { useMemo } from 'react';

import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';

export function useRedPacketProgram(chainId: ChainId) {
    return useMemo(() => {
        return createRedPacketProgram(chainId);
    }, [chainId]);
}
