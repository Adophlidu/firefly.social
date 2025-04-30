'use client';

/**
 * This file re-exports the bindings from the maskbook packages.
 * Always use absolute imports to ensure the dependencies tree is clean.
 *
 * Unsafe packages import paths:
 * /from\s'@masknet/(?!web3-shared|kit|encryption|base|typed-message|shared-base)/i
 *
 */

export { getRegisteredWeb3Networks } from '@/mask_pkgs/web3-providers/Manager/index.js';
export { ExplorerResolver } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ExplorerResolver.js';
export type { BaseHubOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/HubOptions.js';
export { EVMWeb3 } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ConnectionAPI.js';
export {
    EVMChainResolver,
    EVMExplorerResolver,
    EVMNetworkResolver,
} from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ResolverAPI.js';
export {
    SolanaChainResolver,
    SolanaExplorerResolver,
    SolanaNetworkResolver,
} from '@/mask_pkgs/web3-providers/Web3/Solana/apis/ResolverAPI.js';
export { ProfileIdentifier } from '@masknet/base';
