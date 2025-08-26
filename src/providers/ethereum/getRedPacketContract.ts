import { type Address } from 'viem';

import { RED_PACKETS } from '@/constants/rp.js';
import { assert } from '@/helpers/assert.js';
import { type EthereumChainId } from '@/web3-shared/evm/types.js';

export function getRedPacketContractAddress(chainId: EthereumChainId) {
    const address = RED_PACKETS[chainId];
    assert(address, `Red Packet contract not found for chain ID ${chainId}`);

    return address as Address;
}
