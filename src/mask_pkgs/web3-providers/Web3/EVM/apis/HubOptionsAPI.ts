import { type ChainId, getDefaultChainId, getNetworkPluginID } from '@masknet/web3-shared-evm';
import { HubOptionsProvider } from '../../Base/apis/HubOptions.js';

export class EVMHubOptionsProvider extends HubOptionsProvider<ChainId> {
    protected override getDefaultChainId = getDefaultChainId;
    protected override getNetworkPluginID = getNetworkPluginID;
}
