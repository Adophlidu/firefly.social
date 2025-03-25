import { CHAIN_DESCRIPTORS, NETWORK_DESCRIPTORS } from '@masknet/web3-shared-evm';

import { ChainResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ChainResolver.js';
import { ExplorerResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ExplorerResolver.js';
import { NetworkResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/NetworkExplorer.js';

export const EVMChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const EVMExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
export const EVMNetworkResolver = new NetworkResolver(() => NETWORK_DESCRIPTORS);
