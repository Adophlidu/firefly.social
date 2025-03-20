import { getDefaultChainId, getNetworkPluginID } from '@masknet/web3-shared-solana';
import type { ChainId } from '@masknet/web3-shared-solana';
import { HubOptionsProvider } from '../../Base/apis/HubOptions.js';

export class SolanaHubOptionsAPI extends HubOptionsProvider<ChainId> {
    protected override getDefaultChainId = getDefaultChainId;
    protected override getNetworkPluginID = getNetworkPluginID;
}
