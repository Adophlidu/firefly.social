import {
    HappyRedPacketV1ABI,
    HappyRedPacketV2ABI,
    HappyRedPacketV3ABI,
    HappyRedPacketV4ABI,
} from '@/mask/constants.js';
import { type EthereumChainId, getRedPacketConstants } from '#masknet/web3-shared-evm';
import { type Address } from 'viem';

export function getRedPacketContractAddress(chainId: EthereumChainId, version: number) {
    const {
        HAPPY_RED_PACKET_ADDRESS_V1: addressV1,
        HAPPY_RED_PACKET_ADDRESS_V2: addressV2,
        HAPPY_RED_PACKET_ADDRESS_V3: addressV3,
        HAPPY_RED_PACKET_ADDRESS_V4: addressV4,
    } = getRedPacketConstants(chainId);

    const address = [addressV1, addressV2, addressV3, addressV4][version - 1];
    if (!address) throw new Error(`Red Packet contract version ${version} not found for chain ID ${chainId}`);
    return address as Address;
}

export function getRedPacketContractAbi(version: number) {
    const abi = [HappyRedPacketV1ABI, HappyRedPacketV2ABI, HappyRedPacketV3ABI, HappyRedPacketV4ABI][version - 1];
    if (!abi) throw new Error(`Red Packet contract ABI version ${version} not found`);
    return abi;
}
