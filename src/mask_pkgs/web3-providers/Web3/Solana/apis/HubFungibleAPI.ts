import { type ChainId } from '@masknet/web3-shared-solana';
import { BaseHubFungible } from '../../Base/apis/HubFungible.js';
import { SolanaHubOptionsAPI } from './HubOptionsAPI.js';

export class SolanaHubFungibleAPI extends BaseHubFungible<ChainId> {
    protected override HubOptions = new SolanaHubOptionsAPI(this.options);
}
