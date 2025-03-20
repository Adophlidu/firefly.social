import { NetworkPluginID } from '@masknet/shared-base';
import { ChainId, ProviderType } from '../types/index.js';

export function getNetworkPluginID() {
    return NetworkPluginID.PLUGIN_EVM;
}

export function getDefaultChainId() {
    return ChainId.Mainnet;
}

export function getDefaultProviderType() {
    return ProviderType.None;
}
