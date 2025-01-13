import { type ChainId } from '@masknet/web3-shared-evm';
import { useMemo } from 'react';

import { createRedPacketContract } from '@/providers/ethereum/getRedPacketContract.js';

export function useRedPacketContract(chainId: ChainId, version: number) {
    return useMemo(() => {
        return createRedPacketContract(chainId, version);
    }, [chainId, version]);
}
