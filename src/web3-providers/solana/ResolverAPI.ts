import { ChainResolver } from '@/web3-providers/base/ChainResolver.js';
import { ExplorerResolver } from '@/web3-providers/base/ExplorerResolver.js';
import { NetworkResolver } from '@/web3-providers/base/NetworkExplorer.js';
import { CHAIN_DESCRIPTORS, NETWORK_DESCRIPTORS } from '@/web3-shared/solana/descriptors.js';

export const SolanaChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const SolanaExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
export const SolanaNetworkResolver = new NetworkResolver(() => NETWORK_DESCRIPTORS);
