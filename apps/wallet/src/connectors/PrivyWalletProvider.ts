import { unreachable } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import { type Address, type Hash, isHex } from 'viem';

import { withPinCodeCheck } from '@/helpers/withPinCodeCheck.js';
import { BrowserEventEmitter } from '@/lib/EventEmitter.js';
import type { EvmTransaction } from '@/providers/types/Privy.js';
import { chainIdAtom, evmWalletAddressAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';
import { getPrivyWalletApi } from '@/store/privyWalletApiAtom.js';

type RpcMethod =
    | 'eth_requestAccounts'
    | 'eth_accounts'
    | 'personal_sign'
    | 'eth_sendTransaction'
    | 'eth_signTypedData_v4'
    | 'eth_chainId'
    | 'wallet_switchEthereumChain';
type RpcResponse<M extends RpcMethod> = M extends 'eth_requestAccounts' | 'eth_accounts'
    ? Address[]
    : M extends 'personal_sign'
      ? Hash
      : M extends 'eth_sendTransaction'
        ? Hash
        : M extends 'eth_signTypedData_v4'
          ? Hash
          : M extends 'eth_chainId'
            ? string
            : M extends 'wallet_switchEthereumChain'
              ? null
              : never;

export class PrivyWalletProvider extends BrowserEventEmitter {
    private address: string | null = null;

    constructor() {
        super();

        store.sub(chainIdAtom, () => {
            const currentAtomChainId = store.get(chainIdAtom);
            const hexChainId = `0x${currentAtomChainId.toString(16)}`;
            this.emit('chainChanged', hexChainId);
        });
    }

    async request<M extends RpcMethod>({
        method,
        params,
    }: {
        method: M;
        params?: object | unknown[];
    }): Promise<RpcResponse<M>> {
        switch (method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
                if (!this.address) {
                    const address = store.get(evmWalletAddressAtom);
                    this.address = address;
                }
                return compact([this.address]) as RpcResponse<M>;

            case 'personal_sign': {
                if (!params || !Array.isArray(params) || params.length === 0) {
                    throw new Error('Invalid parameters for personal_sign');
                }

                return withPinCodeCheck(async (pinCode) => {
                    const signature = await getPrivyWalletApi().personalSign({
                        message: params[0] as string,
                        encoding: isHex(params[0]) ? 'hex' : 'utf-8',
                        privy_code_hash: pinCode,
                    });
                    return signature.signature as RpcResponse<M>;
                });
            }

            case 'eth_sendTransaction':
                try {
                    if (Array.isArray(params) && params[0] && typeof params[0] === 'object') {
                        const transaction: EvmTransaction = {
                            from: params[0].from,
                            to: params[0].to,
                            value: params[0].value,
                            data: params[0].data,
                            gas_limit: params[0].gasLimit,
                            gas: params[0].gas,
                            gasPrice: params[0].gasPrice,
                            type: isHex(params[0].type) ? parseInt(params[0].type, 16) : params[0].type || undefined,
                            chain_id: store.get(chainIdAtom).toString(),
                        };

                        return await withPinCodeCheck(async (pinCode) => {
                            const result = await getPrivyWalletApi().sendEvmTransaction({
                                transaction,
                                privy_code_hash: pinCode,
                            });
                            return result.hash as RpcResponse<M>;
                        });
                    }

                    throw new Error('Invalid parameters for eth_sendTransaction');
                } catch (_e) {
                    throw new Error('User rejected the request.');
                }

            case 'eth_signTypedData_v4': {
                if (Array.isArray(params) && params[1] && typeof params[1] === 'string') {
                    return withPinCodeCheck(async (pinCode) => {
                        const typedSig = await getPrivyWalletApi().signEip712TypedData({
                            json_str: params[1],
                            privy_code_hash: pinCode,
                        });
                        return typedSig.signature as RpcResponse<M>;
                    });
                }

                throw new Error('Invalid parameters for eth_signTypedData_v4');
            }
            case 'eth_chainId': {
                const chainId = store.get(chainIdAtom);
                return `0x${chainId.toString(16)}` as RpcResponse<M>;
            }
            case 'wallet_switchEthereumChain': {
                if (Array.isArray(params) && params[0] && 'chainId' in params[0] && isHex(params[0].chainId)) {
                    const targetChainIdHex = params[0].chainId;
                    const newChainId = parseInt(targetChainIdHex, 16);
                    store.set(chainIdAtom, newChainId);
                }
                return null as RpcResponse<M>;
            }
            default:
                unreachable(method);
        }
    }
}
