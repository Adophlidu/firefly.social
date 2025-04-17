import { createWeb3FromURL } from '@/mask_pkgs/web3-providers/helpers/createWeb3FromURL.js';
import { createWeb3ProviderFromURL } from '@/mask_pkgs/web3-providers/helpers/createWeb3ProviderFromURL.js';
import { ConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ConnectionOptions.js';
import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';
import { ProviderURL, type RequestArguments } from '#masknet/web3-shared-evm';

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
