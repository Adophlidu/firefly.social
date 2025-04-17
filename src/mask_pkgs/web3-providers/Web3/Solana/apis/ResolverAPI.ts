import { ChainResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ChainResolver.js';
import { ExplorerResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ExplorerResolver.js';
import { NetworkResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/NetworkExplorer.js';
import { CHAIN_DESCRIPTORS, NETWORK_DESCRIPTORS } from '#masknet/web3-shared-solana';

export const SolanaChainResolver = new ChainResolver(() => CHAIN_DESCRIPTORS);
export const SolanaExplorerResolver = new ExplorerResolver(() => CHAIN_DESCRIPTORS);
export const SolanaNetworkResolver = new NetworkResolver(() => NETWORK_DESCRIPTORS);
