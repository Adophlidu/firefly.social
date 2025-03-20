import { type RequestArguments } from '@masknet/web3-shared-evm';
import { ConnectionContext } from '../libs/ConnectionContext.js';
import type { EVMConnectionOptions } from '../types/index.js';

export function createContext(requestArguments: RequestArguments, options?: EVMConnectionOptions) {
    return new ConnectionContext(requestArguments, options);
}
