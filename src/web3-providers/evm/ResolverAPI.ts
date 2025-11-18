import { ChainResolver } from '@/web3-providers/base/ChainResolver.js';
import { ExplorerResolver } from '@/web3-providers/base/ExplorerResolver.js';
import { NetworkResolver } from '@/web3-providers/base/NetworkExplorer.js';
import { CHAIN_DESCRIPTORS, NETWORK_DESCRIPTORS } from '@/web3-shared/evm/descriptors.js';

export const EVMChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const EVMExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
export const EVMNetworkResolver = new NetworkResolver(() => NETWORK_DESCRIPTORS);
