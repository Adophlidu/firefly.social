import type { ChainId } from '@masknet/web3-shared-evm';
import type { BaseConnectionOptions } from '../../Base/apis/ConnectionOptions.js';
import type { BaseHubOptions } from '../../Base/apis/HubOptions.js';

export type EVMConnectionOptions = BaseConnectionOptions;
export type EVMHubOptions = BaseHubOptions<ChainId>;
