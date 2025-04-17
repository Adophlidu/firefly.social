import { unreachable } from '@masknet/kit';

import { NetworkPluginID } from '@/constants/enum.js';
import type { Web3Helper } from '#masknet/web3-helpers';
import { NETWORK_DESCRIPTORS as evm_network } from '#masknet/web3-shared-evm';
import { NETWORK_DESCRIPTORS as solana_network } from '#masknet/web3-shared-solana';

function getRegistry(ID: NetworkPluginID) {
    switch (ID) {
        case NetworkPluginID.PLUGIN_EVM:
            return evm_network;
        case NetworkPluginID.PLUGIN_SOLANA:
            return solana_network;
        default:
            unreachable(ID);
    }
}

/**
 * Get Web3 Networks, for example, mainnet, testnet, Optimism, etc.
 * @param ID Network name
 */
export function getRegisteredWeb3Networks<T extends NetworkPluginID>(
    ID: T,
): ReadonlyArray<Web3Helper.Web3NetworkDescriptor<T>>;
export function getRegisteredWeb3Networks(
    ID: NetworkPluginID,
): ReadonlyArray<Web3Helper.Web3NetworkDescriptor<NetworkPluginID>> {
    return getRegistry(ID);
}
