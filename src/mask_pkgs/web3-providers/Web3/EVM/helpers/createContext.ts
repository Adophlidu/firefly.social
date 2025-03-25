import { type RequestArguments } from '@masknet/web3-shared-evm';

import { ConnectionContext } from '@/mask_pkgs/web3-providers/Web3/EVM/libs/ConnectionContext.js';
import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';

export function createContext(requestArguments: RequestArguments, options?: EVMConnectionOptions) {
    return new ConnectionContext(requestArguments, options);
}
