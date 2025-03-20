import { ProviderURL, type RequestArguments } from '@masknet/web3-shared-evm';
import type { EVMConnectionOptions } from '../types/index.js';
import { createWeb3FromURL } from '../../../helpers/createWeb3FromURL.js';
import { createWeb3ProviderFromURL } from '../../../helpers/createWeb3ProviderFromURL.js';
import { ConnectionOptions } from '../../Base/apis/ConnectionOptions.js';

export class EVMRequestReadonlyAPI {
    get request() {
        return async <T>(requestArguments: RequestArguments, initial?: EVMConnectionOptions) => {
            return (await this.getWeb3Provider(initial).request(requestArguments)) as T;
        };
    }

    getWeb3(initial?: EVMConnectionOptions) {
        const options = ConnectionOptions.fill(initial);
        return createWeb3FromURL(options.providerURL ?? ProviderURL.from(options.chainId));
    }

    getWeb3Provider(initial?: EVMConnectionOptions) {
        const options = ConnectionOptions.fill(initial);
        return createWeb3ProviderFromURL(options.providerURL ?? ProviderURL.from(options.chainId));
    }
}

export const EVMRequestReadonly = new EVMRequestReadonlyAPI();
