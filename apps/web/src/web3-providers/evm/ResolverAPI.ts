import { ChainResolver } from '@/web3-providers/base/ChainResolver.js';
import { ExplorerResolver } from '@/web3-providers/base/ExplorerResolver.js';
import { CHAIN_DESCRIPTORS } from '@/web3-shared/evm/descriptors.js';

export const EthChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const EthExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
