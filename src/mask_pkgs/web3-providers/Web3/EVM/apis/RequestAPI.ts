import { PayloadEditor, type RequestArguments } from '@masknet/web3-shared-evm';

import { createWeb3FromProvider } from '@/mask_pkgs/web3-providers/helpers/createWeb3FromProvider.js';
import { createWeb3ProviderFromRequest } from '@/mask_pkgs/web3-providers/helpers/createWeb3ProviderFromRequest.js';
import { ConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ConnectionOptions.js';
import { Composer } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ComposerAPI.js';
import {
    EVMRequestReadonly,
    EVMRequestReadonlyAPI,
} from '@/mask_pkgs/web3-providers/Web3/EVM/apis/RequestReadonlyAPI.js';
import { createContext } from '@/mask_pkgs/web3-providers/Web3/EVM/helpers/createContext.js';
import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';

class EVMRequestAPI extends EVMRequestReadonlyAPI {
    private Request = EVMRequestReadonly;

    // Hijack RPC requests and process them with koa like middleware
    override get request() {
        return <T>(requestArguments: RequestArguments, initial?: EVMConnectionOptions) => {
            return new Promise<T>(async (resolve, reject) => {
                const options = ConnectionOptions.fill(initial);
                const context = createContext(requestArguments, options);

                try {
                    await Composer.compose().dispatch(context, async () => {
                        if (!context.writable) return;
                        try {
                            if (!PayloadEditor.fromPayload(context.request).readonly) {
                                const result = undefined;
                                context.write(result as T);
                            } else {
                                context.write(
                                    await this.Request.request(context.requestArguments, {
                                        account: options.account,
                                        chainId: options.chainId,
                                    }),
                                );
                            }
                        } catch (error) {
                            context.abort(error);
                        }
                    });
                } catch (error) {
                    context.abort(error);
                } finally {
                    if (context.error) reject(context.error);
                    else resolve(context.result as T);
                }
            });
        };
    }

    override getWeb3(initial?: EVMConnectionOptions) {
        const options = ConnectionOptions.fill(initial);
        if (options.readonly) return this.Request.getWeb3(options);
        return createWeb3FromProvider(
            createWeb3ProviderFromRequest((requestArguments) => this.request(requestArguments, options)),
        );
    }
}
export const EVMRequest = new EVMRequestAPI();
