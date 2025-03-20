import type { ChainId } from '@masknet/web3-shared-solana';
import { SolanaHubOptionsAPI } from './HubOptionsAPI.js';
import { BaseHubProvider } from '../../Base/apis/HubBase.js';

export class SolanaBaseHub extends BaseHubProvider<ChainId> {
    protected override HubOptions = new SolanaHubOptionsAPI(this.options);
}
