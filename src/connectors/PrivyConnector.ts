import { type Address, numberToHex, RpcError, SwitchChainError } from 'viem';
import { ChainNotConfiguredError, ConnectorChainMismatchError, createConnector, type CreateConnectorFn } from 'wagmi';

import type { PrivyBridgeElement } from '@/components/PrivyBridge.js';
import { NetworkType } from '@/constants/enum.js';
import { AbortError, InvalidResultError } from '@/constants/error.js';
import { retry } from '@/helpers/retry.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { EthereumMethodType } from '@/web3-shared/evm/types.js';

export function getPrivyBridge() {
    if (typeof window === 'undefined') return;
    return document.querySelector('privy-bridge') as PrivyBridgeElement;
}

async function getProvider(signal?: AbortSignal) {
    return retry(
        async () => {
            if (typeof window === 'undefined') throw new AbortError();
            const wallet = usePrivyWalletStore
                .getState()
                .wallets[NetworkType.Ethereum].find((x) => x.connectorType === 'embedded');
            if (!wallet) throw new InvalidResultError();
            return wallet.getEthereumProvider();
        },
        {
            times: 5,
            interval: 2000,
            signal,
        },
    );
}

export const PRIVY_CONNECTOR_ID = 'network.privy';

export function createPrivyConnector() {
    const fn = (config: Parameters<CreateConnectorFn>[0]) => {
        return {
            id: PRIVY_CONNECTOR_ID,
            name: 'Firefly Wallet',
            type: 'INJECTED',
            icon: '/firefly.png',
            async connect(parameters) {
                const chainId = await this.getChainId();
                const provider = await getProvider();
                const accounts: Address[] = await provider.request({
                    method: 'eth_requestAccounts',
                });
                console.info(`[privy] connect`, chainId, accounts);
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
                    const provider = await getProvider();

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
                const provider = await getProvider();
                const chainId = await provider.request({
                    method: EthereumMethodType.ETH_CHAIN_ID,
                    params: [],
                });
                return Number.parseInt(chainId, 16);
            },
            async getAccounts() {
                const wallets =
                    getPrivyBridge()
                        ?.getWallets()
                        .evmWallets.filter((x) => x.connectorType === 'embedded') ?? [];
                return [...wallets?.map((x) => x.address as Address)];
            },
            async getProvider() {
                const isLogin = !!useFireflyProfileStore.getState().currentProfileSession;
                if (!isLogin) return;
                const isAuthorized = !!getPrivyBridge()?.getAuthenticated?.();
                if (!isAuthorized) return;
                return getProvider();
            },
            async isAuthorized() {
                const isLogin = !!useFireflyProfileStore.getState().currentProfileSession;
                if (!isLogin) return false;
                const isAuthorized = !!getPrivyBridge()?.getAuthenticated?.();
                console.info(`[privy] isAuthorized`, isAuthorized);
                return isAuthorized;
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
