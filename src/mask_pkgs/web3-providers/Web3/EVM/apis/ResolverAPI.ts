import { NETWORK_DESCRIPTORS, CHAIN_DESCRIPTORS } from '@masknet/web3-shared-evm';
import { ChainResolver } from '../../Base/apis/ChainResolver.js';
import { ExplorerResolver } from '../../Base/apis/ExplorerResolver.js';
import { NetworkResolver } from '../../Base/apis/NetworkExplorer.js';

export const EVMChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const EVMExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
export const EVMNetworkResolver = new NetworkResolver(() => NETWORK_DESCRIPTORS);
