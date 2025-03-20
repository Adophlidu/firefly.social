import { type ChainId } from '@masknet/web3-shared-evm';
import { BaseHubFungible } from '../../Base/apis/HubFungible.js';
import { EVMHubOptionsProvider } from './HubOptionsAPI.js';

export class HubFungibleAPI extends BaseHubFungible<ChainId> {
    protected override HubOptions = new EVMHubOptionsProvider(this.options);
}
