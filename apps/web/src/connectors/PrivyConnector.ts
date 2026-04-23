'use client';

import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { isFreeGasSupportedChain } from '@dimensiondev/web3/chains';
import { isSupportedStablecoin } from '@dimensiondev/web3/utils';
import { compact } from 'lodash-es';
import { type Address, type Hex, numberToHex, type RpcError, SwitchChainError, UserRejectedRequestError } from 'viem';
import { mainnet } from 'viem/chains';
import { ChainNotConfiguredError, ConnectorChainMismatchError, createConnector, type CreateConnectorFn } from 'wagmi';

import { queryClient } from '@/configs/queryClient.js';
import { WalletSource } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { logger } from '@/libs/Logger.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
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

const FREE_GAS_SELECTORS = new Set(['0xa9059cbb', '0x095ea7b3', '0x5db05aba']);
const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';

function parseChainId(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? Number.parseInt(value, 16) : Number(value);
}

function isFreeGasCandidate(params: { method: string; params?: unknown[] | object }): boolean {
    if (params.method !== 'eth_sendTransaction') return false;
    if (!Array.isArray(params.params) || params.params.length === 0) return false;
    const tx = params.params[0] as Record<string, unknown> | undefined;
    if (!tx || typeof tx.data !== 'string' || tx.data.length < 10) return false;
    const selector = tx.data.slice(0, 10).toLowerCase();
    if (!FREE_GAS_SELECTORS.has(selector)) return false;

    const chainId = parseChainId(tx.chainId);

    // ERC20 transfer: must be USDC/USDT on a supported chain
    if (selector === ERC20_TRANSFER_SELECTOR) {
        if (chainId === null) return false;
        if (!isFreeGasSupportedChain(chainId)) return false;
        const to = typeof tx.to === 'string' ? tx.to : '';
        return isSupportedStablecoin(chainId, to);
    }

    // Approve / red packet: only check chain support when chainId is present
    if (chainId !== null && !isFreeGasSupportedChain(chainId)) return false;
    return true;
}

export async function waitForAuthorization(): Promise<void> {
    if (useFireflyWalletStore.getState().isAuthorized) return;
    await new Promise<void>((resolve) => {
        const unsubscribe = useFireflyWalletStore.subscribe((state) => {
            if (!state.isAuthorized) return;
            unsubscribe();
            resolve();
        });
    });
}

function getPrivyEvmProvider({
    silent,
}: {
    silent?: boolean;
} = {}) {
    return {
        async request<T = unknown>(params: { method: string; params?: unknown[] | object }): Promise<T> {
            const freeGas = isFreeGasCandidate(params);

            // Only open wallet for interactive methods that aren't free-gas candidates
            if (!silent && INTERACTIVE_METHODS.has(params.method) && !freeGas) {
                useGlobalState.getState().updateFireflyWalletIsOpen(true);
            }
            if (!useFireflyWalletStore.getState().isAuthorized) {
                await waitForAuthorization();
            }
            if (silent) {
                await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY, { visible: false });
            }
            return new Promise(async (resolve, reject) => {
                // Only watch for user-dismissal if wallet was opened
                let unsubscribe: (() => void) | null = null;
                if (!silent && !freeGas) {
                    unsubscribe = useGlobalState.subscribe((state) => {
                        if (!state.fireflyWalletIsOpen) {
                            unsubscribe?.();
                            reject(new UserRejectedRequestError(new Error()));
                        }
                    });
                }
                iframeBridgeProvider
                    .request(IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC, params)
                    .then((rpcResult) => {
                        unsubscribe?.();
                        if (!silent && !freeGas) {
                            useGlobalState.getState().updateFireflyWalletIsOpen(false);
                        } else if (silent) {
                            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY, {
                                visible: true,
                            });
                        }
                        resolve(rpcResult as T);
                    })
                    .catch((error) => {
                        unsubscribe?.();
                        if (`${error}`.includes('user rejected')) {
                            reject(new UserRejectedRequestError(new Error()));
                            return;
                        }
                        reject(error);
                    });
            });
        },
    };
}

export const privyEvmProvider = getPrivyEvmProvider();
export const privyEvmProviderSilent = getPrivyEvmProvider({ silent: true });

export function createPrivyConnector() {
    const fn = (config: Parameters<CreateConnectorFn>[0]) => {
        return {
            id: PRIVY_CONNECTOR_ID,
            name: 'Firefly Wallet',
            type: 'INJECTED',
            icon: '/firefly.png',
            async connect(parameters) {
                const chainId = await this.getChainId().catch(() => mainnet.id);
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
                logger.debug(`[privy] disconnect`);
                config.emitter.emit('disconnect');
            },
            async switchChain(parameters) {
                const chain = config.chains.find((x) => x.id === parameters.chainId);
                if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

                try {
                    await privyEvmProvider.request({
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
                    throw new SwitchChainError(error as RpcError);
                }
            },
            async getChainId() {
                const chainId = await privyEvmProvider.request<Hex>({
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
                return isAuthorized ? privyEvmProvider : null;
            },
            async isAuthorized() {
                return !!getSessionFromStorage(SessionType.Firefly);
            },
            onAccountsChanged(account) {
                logger.debug(`[privy] onAccountsChanged`, account);
            },
            onChainChanged(chainId) {
                logger.debug(`[privy] onChainChanged`, chainId);
            },
            onConnect(connectInfo) {
                logger.debug(`[privy] onConnect`, connectInfo);
            },
            onDisconnect(error) {
                logger.debug(`[privy] onDisconnect`, error);
            },
            onMessage(message) {
                logger.debug(`[privy] onMessage`, message);
            },
        } as ReturnType<CreateConnectorFn>;
    };

    return createConnector(fn);
}
