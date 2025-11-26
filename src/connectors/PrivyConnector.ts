'use client';

import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { compact } from 'lodash-es';
import { type Address, type Hex, numberToHex, RpcError, SwitchChainError, UserRejectedRequestError } from 'viem';
import { mainnet } from 'viem/chains';
import { ChainNotConfiguredError, ConnectorChainMismatchError, createConnector, type CreateConnectorFn } from 'wagmi';

import { queryClient } from '@/configs/queryClient.js';
import { WalletSource } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { EthereumMethodType } from '@/web3-shared/evm/types.js';

export const PRIVY_CONNECTOR_ID = 'network.privy';

const INTERACTIVE_METHODS = new Set([
    'eth_sendTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
]);

const provider = {
    async request<T = unknown>(params: { method: string; params?: unknown[] | object }): Promise<T> {
        if (INTERACTIVE_METHODS.has(params.method)) {
            useGlobalState.getState().updateFireflyWalletIsOpen(true);
        }
        return new Promise(async (resolve, reject) => {
            const unsubscribe = useGlobalState.subscribe((state) => {
                if (!state.fireflyWalletIsOpen) {
                    unsubscribe();
                    reject(new UserRejectedRequestError(new Error()));
                }
            });
            iframeBridgeProvider
                .request(IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC, params)
                .then((rpcResult) => {
                    unsubscribe();
                    useGlobalState.getState().updateFireflyWalletIsOpen(false);
                    resolve(rpcResult as T);
                })
                .catch((error) => {
                    unsubscribe();
                    if (`${error}`.includes('user rejected')) {
                        reject(new UserRejectedRequestError(new Error()));
                        return;
                    }
                    reject(error);
                });
        });
    },
};

export function createPrivyConnector() {
    const fn = (config: Parameters<CreateConnectorFn>[0]) => {
        return {
            id: PRIVY_CONNECTOR_ID,
            name: 'Firefly Wallet',
            type: 'INJECTED',
            icon: '/firefly.png',
            async connect(parameters) {
                const chainId = mainnet.id;
                const accounts = await this.getAccounts();
                if (!accounts || accounts.length === 0) {
                    throw new UserRejectedRequestError(new Error('No accounts returned'));
                }
                config.emitter.emit('connect', {
                    accounts,
                    chainId,
                });

                if (parameters?.withCapabilities === true) {
                    return {
                        accounts: Object.freeze(
                            accounts.map((address) => ({
                                address,
                                capabilities: {} as Record<string, unknown>,
                            })),
                        ),
                        chainId,
                    };
                }

                return {
                    accounts,
                    chainId,
                };
            },
            async disconnect() {
                console.info(`[privy] disconnect`);
                config.emitter.emit('disconnect');
            },
            async switchChain(parameters) {
                console.info(`[privy] switchChain`, parameters);

                const chain = config.chains.find((x) => x.id === parameters.chainId);
                if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

                try {
                    await provider.request({
                        method: EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN,
                        params: [
                            {
                                chainId: numberToHex(parameters.chainId),
                            },
                        ],
                    });

                    const currentChainId = await this.getChainId();
                    if (currentChainId === parameters.chainId) {
                        config.emitter.emit('change', { chainId: parameters.chainId });
                    } else {
                        throw new ConnectorChainMismatchError({
                            connectionChainId: currentChainId,
                            connectorChainId: parameters.chainId,
                        });
                    }

                    return chain;
                } catch (error) {
                    console.error(`[privy] switchChain error`, error);
                    throw new SwitchChainError(error as RpcError);
                }
            },
            async getChainId() {
                const chainId = await provider.request<Hex>({
                    method: EthereumMethodType.ETH_CHAIN_ID,
                });
                return Number.parseInt(chainId, 16);
            },
            async getAccounts() {
                const { connected } = await queryClient.ensureQueryData(queryMyAllConnections);
                const [account] = connected.filter(
                    (connection) => connection.source === WalletSource.Privy && connection.platform === 'eth',
                );
                const accounts = compact([account.address as Address]);
                if (!accounts || accounts.length === 0) {
                    throw new UserRejectedRequestError(new Error('No accounts returned'));
                }
                return accounts;
            },
            async getProvider() {
                const isAuthorized = await this.isAuthorized();
                return isAuthorized ? provider : null;
            },
            async isAuthorized() {
                return !!getSessionFromStorage(SessionType.Firefly);
            },
            onAccountsChanged(account) {
                console.log(`[privy] onAccountsChanged`, account);
            },
            onChainChanged(chainId) {
                console.log(`[privy] onChainChanged`, chainId);
            },
            onConnect(connectInfo) {
                console.log(`[privy] onConnect`, connectInfo);
            },
            onDisconnect(error) {
                console.log(`[privy] onDisconnect`, error);
            },
            onMessage(message) {
                console.log(`[privy] onMessage`, message);
            },
        } as ReturnType<CreateConnectorFn>;
    };

    return createConnector(fn);
}
