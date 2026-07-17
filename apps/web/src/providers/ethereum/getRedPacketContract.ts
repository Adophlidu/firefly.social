import { assert } from '@dimensiondev/utils';
import { RED_PACKETS } from '@dimensiondev/web3/chains';

export function getRedPacketContractAddress(chainId: number) {
    const address = RED_PACKETS[chainId];
    assert(address, `Red Packet contract not found for chain ID ${chainId}`);

    return address;
}
