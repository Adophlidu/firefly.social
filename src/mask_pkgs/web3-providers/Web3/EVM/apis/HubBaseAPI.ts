import { ChainId } from '@masknet/web3-shared-evm';
import { BaseHubProvider } from '../../Base/apis/HubBase.js';
import { EVMHubOptionsProvider } from './HubOptionsAPI.js';

export class EVMBaseHub extends BaseHubProvider<ChainId> {
    protected override HubOptions = new EVMHubOptionsProvider(this.options);
}
