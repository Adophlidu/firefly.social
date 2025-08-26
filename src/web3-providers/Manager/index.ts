import { NetworkPluginID } from '@/constants/enum.js';
import { unreachable } from '@/helpers/unreachable.js';
import type { Web3Helper } from '@/web3-helpers/index.js';
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
