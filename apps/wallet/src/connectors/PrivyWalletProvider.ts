import { unreachable, UserRejectionError } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import { type Address, type Hash, type Hex, isHex } from 'viem';

import { TokenApproveFlowModal } from '@/components/TokenApproveFlow/TokenApproveFlowModal.js';
import { tryParseErc20ApproveSession, tryParseTokenApprovalTypedData } from '@/helpers/evm/tokenApprovalSession.js';
import { withPinCodeCheck } from '@/helpers/withPinCodeCheck.js';
import { BrowserEventEmitter } from '@/lib/EventEmitter.js';
import type { EvmTransaction } from '@/providers/types/Privy.js';
import { chainIdAtom, evmRpcRequestContextAtom, evmWalletAddressAtom } from '@/store/embeddedWallets.js';
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

            case 'eth_sendTransaction': {
                if (!Array.isArray(params) || !params[0] || typeof params[0] !== 'object') {
                    throw new Error('Invalid parameters for eth_sendTransaction');
                }
                const rawTx = params[0] as Record<string, unknown> & {
                    from?: string;
                    to?: string;
                    value?: string;
                    data?: string;
                    gasLimit?: string;
                    gas?: string;
                    gasPrice?: string;
                    type?: string | number;
                };
                const dataHex = typeof rawTx.data === 'string' ? (rawTx.data as Hex) : undefined;
                const approvalSession = tryParseErc20ApproveSession(rawTx.to, dataHex);
                const walletAddress = store.get(evmWalletAddressAtom) ?? '';
                const chainId = store.get(chainIdAtom);
                const requestOrigin = store.get(evmRpcRequestContextAtom)?.requestOrigin;
                if (approvalSession && walletAddress) {
                    const ui = await TokenApproveFlowModal.call({
                        session: approvalSession,
                        walletAddress,
                        chainId,
                        requestOrigin,
                        txBase: rawTx,
                    });
                    if (!ui.accepted) throw new UserRejectionError('User rejected token approval');
                    if (ui.kind === 'erc20Approve') {
                        rawTx.data = ui.calldata;
                    }
                }

                try {
                    const txType: 0 | 1 | 2 | 4 | undefined =
                        typeof rawTx.type === 'string' && isHex(rawTx.type)
                            ? (parseInt(rawTx.type, 16) as 0 | 1 | 2 | 4)
                            : typeof rawTx.type === 'number'
                              ? (rawTx.type as 0 | 1 | 2 | 4)
                              : undefined;

                    const transaction: EvmTransaction = {
                        from: String(rawTx.from ?? ''),
                        to: String(rawTx.to ?? ''),
                        value: String(rawTx.value ?? '0'),
                        data: String(rawTx.data ?? ''),
                        gas_limit: String(rawTx.gas ?? '0'),
                        gasPrice: String(rawTx.gasPrice ?? '0'),
                        type: txType,
                        chain_id: chainId.toString(),
                    };

                    return await withPinCodeCheck(async (pinCode) => {
                        const result = await getPrivyWalletApi().sendEvmTransaction({
                            transaction,
                            privy_code_hash: pinCode,
                        });
                        return result.hash as RpcResponse<M>;
                    });
                } catch (error) {
                    if (error instanceof UserRejectionError) throw error;
                    throw new Error('User rejected the request.');
                }
            }

            case 'eth_signTypedData_v4': {
                if (!Array.isArray(params) || !params[1] || typeof params[1] !== 'string') {
                    throw new Error('Invalid parameters for eth_signTypedData_v4');
                }
                let typedDataJson = params[1] as string;
                const typedSession = tryParseTokenApprovalTypedData(typedDataJson);
                const walletAddress = store.get(evmWalletAddressAtom) ?? '';
                const chainId = store.get(chainIdAtom);
                const requestOrigin = store.get(evmRpcRequestContextAtom)?.requestOrigin;
                if (typedSession && walletAddress) {
                    const ui = await TokenApproveFlowModal.call({
                        session: typedSession,
                        walletAddress,
                        chainId,
                        requestOrigin,
                    });
                    if (!ui.accepted) throw new UserRejectionError('User rejected token approval');
                    if (ui.kind === 'eip2612Permit' || ui.kind === 'permit2Single') {
                        typedDataJson = ui.typedDataJson;
                    }
                }

                return withPinCodeCheck(async (pinCode) => {
                    const typedSig = await getPrivyWalletApi().signEip712TypedData({
                        json_str: typedDataJson,
                        privy_code_hash: pinCode,
                    });
                    return typedSig.signature as RpcResponse<M>;
                });
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
