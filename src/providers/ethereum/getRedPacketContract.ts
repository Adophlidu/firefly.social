import { type ChainId, createContract, getRedPacketConstants } from '@masknet/web3-shared-evm';

import {
    type HappyRedPacketV1,
    HappyRedPacketV1ABI,
    type HappyRedPacketV2,
    HappyRedPacketV2ABI,
    type HappyRedPacketV3,
    HappyRedPacketV3ABI,
    type HappyRedPacketV4,
    HappyRedPacketV4ABI,
} from '@/mask/constants.js';
import { EVMWeb3 } from '@/mask/index.js';

export function createRedPacketContract(chainId: ChainId, version: number) {
    const {
        HAPPY_RED_PACKET_ADDRESS_V1: addressV1,
        HAPPY_RED_PACKET_ADDRESS_V2: addressV2,
        HAPPY_RED_PACKET_ADDRESS_V3: addressV3,
        HAPPY_RED_PACKET_ADDRESS_V4: addressV4,
    } = getRedPacketConstants(chainId);
    const web3 = EVMWeb3.getWeb3({ chainId });
    const v1 = createContract<HappyRedPacketV1>(web3, addressV1, HappyRedPacketV1ABI as any[]);
    const v2 = createContract<HappyRedPacketV2>(web3, addressV2, HappyRedPacketV2ABI as any[]);
    const v3 = createContract<HappyRedPacketV3>(web3, addressV3, HappyRedPacketV3ABI as any[]);
    const v4 = createContract<HappyRedPacketV4>(web3, addressV4, HappyRedPacketV4ABI as any[]);
    const versions = [v1, v2, v3, v4] as const;

    return versions[version - 1];
}
