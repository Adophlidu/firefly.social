import { getAddress } from 'viem';
import { createConnector } from 'wagmi';

import { PrivyWalletProvider } from '@/connectors/PrivyWalletProvider.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { logger } from '@/lib/Logger.js';
import { chainIdAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

type EvmProvider = InstanceType<typeof PrivyWalletProvider>;
const privyWalletProvider: EvmProvider = new PrivyWalletProvider();

export function createPrivyWalletConnector() {
    return createConnector(((config) => {
        return {
            id: PRIVY_CONNECTOR_ID,
            name: 'Firefly Wallet',
            type: 'injected',
            async setup() {},
            async connect({ chainId } = {}) {
                try {
                    let newChainId = store.get(chainIdAtom);
                    if (chainId) {
                        const chain = config.chains.find((x) => x.id === chainId);
                        if (chain) {
                            newChainId = chainId;
                        }
                    }

                    if (this.switchChain) {
                        await this.switchChain({ chainId: newChainId });
                    }

                    const provider = (await this.getProvider()) as EvmProvider;
                    const accounts = await provider.request({ method: 'eth_requestAccounts', params: [] });

                    return {
                        accounts: accounts.map(getAddress),
                        chainId: newChainId,
                    };
                } catch (error) {
                    logger.error('Failed to connect backend wallet', error);
                    throw error;
                }
            },

            async disconnect() {},

            async getAccounts() {
                const provider = (await this.getProvider()) as EvmProvider;
                const accounts = await provider.request({ method: 'eth_accounts', params: [] });
                return accounts.map(getAddress);
            },

            async getChainId() {
                const provider = (await this.getProvider()) as EvmProvider;
                const chainIdHex = await provider.request({ method: 'eth_chainId', params: [] });
                return parseInt(chainIdHex, 16);
            },

            async switchChain({ chainId }) {
                const chain = config.chains.find((x) => x.id === chainId);
                if (!chain) {
                    throw new Error(`Chain with id ${chainId} not found`);
                }

                const provider = (await this.getProvider()) as EvmProvider;
                const chainIdHex = `0x${chainId.toString(16)}`;
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }],
                });

                store.set(chainIdAtom, chainId);
                config.emitter.emit('change', { chainId });

                return chain;
            },

            async getProvider(): Promise<typeof privyWalletProvider> {
                return privyWalletProvider;
            },

            async isAuthorized() {
                const provider = (await this.getProvider()) as EvmProvider;
                try {
                    const accounts = await provider.request({ method: 'eth_accounts', params: [] });
                    return !!accounts.length;
                } catch {
                    return false;
                }
            },

            onAccountsChanged(accounts) {
                if (accounts.length === 0) config.emitter.emit('disconnect');
                else config.emitter.emit('change', { accounts: accounts.map(getAddress) });
            },
            onChainChanged(chain) {
                config.emitter.emit('change', { chainId: Number(chain) });
            },
            onDisconnect() {
                config.emitter.emit('disconnect');
            },
        };
    }) as Parameters<typeof createConnector>[0]);
}
