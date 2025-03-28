import type { EthereumChainId } from '@masknet/web3-shared-evm';

import type { BaseConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ConnectionOptions.js';
import type { BaseHubOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/HubOptions.js';

export type EVMConnectionOptions = BaseConnectionOptions;
export type EVMHubOptions = BaseHubOptions<EthereumChainId>;
