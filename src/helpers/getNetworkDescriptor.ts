import { unreachable } from '@dimensiondev/utils';

import { NetworkPluginID } from '@/constants/enum.js';
import { NETWORK_DESCRIPTORS as evm_networks } from '@/web3-shared/evm/descriptors.js';
import { NETWORK_DESCRIPTORS as solana_networks } from '@/web3-shared/solana/descriptors.js';

function getRegistry(ID: NetworkPluginID) {
    switch (ID) {
        case NetworkPluginID.PLUGIN_EVM:
            return evm_networks;
        case NetworkPluginID.PLUGIN_SOLANA:
            return solana_networks;
        default:
            unreachable(ID);
    }
}

export function getNetworkDescriptor(expectedPluginID: NetworkPluginID, expectedChainId?: number) {
    return getRegistry(expectedPluginID).find((x) => x.chainId === expectedChainId);
}
