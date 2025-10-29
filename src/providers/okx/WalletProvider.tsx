import { web3 } from '@coral-xyz/anchor';
import type { EthereumProvider, JsonRpcRequest, SolanaProvider } from '@okxweb3/dex-widget';
import { type Provider, type ProviderEventEmitterMethods } from '@reown/appkit-adapter-solana';
import { type GetWalletClientReturnType, watchAccount } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { runInSafe } from '@/helpers/runInSafe.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export class EthereumWalletProvider implements EthereumProvider {
    #walletClient: GetWalletClientReturnType | null = null;
    #listeners: Record<string, Set<(...args: any[]) => void>> = {};
    #unwatchFns: Array<() => void> = [];

    selectedAddress = '';
    accounts: string[] = [];

    async getWalletClient(): Promise<Exclude<GetWalletClientReturnType, null>> {
        if (this.#walletClient) return this.#walletClient;
        const walletClient = await getWalletClientRequired(wagmiConfig);
        this.#walletClient = walletClient;
        return walletClient;
    }

    on(event: string, listener: (...args: any[]) => void): void {
        if (!this.#listeners[event]) {
            this.#listeners[event] = new Set();
        }
        this.#listeners[event].add(listener);

        if (this.#listeners[event].size === 1) {
            this.#setupWatcher(event);
        }
    }

    #setupWatcher(event: string) {
        switch (event) {
            case 'accountsChanged':
                const unwatchAcc = watchAccount(wagmiConfig, {
                    onChange: async (account) => {
                        const address = account.address ?? '';
                        this.selectedAddress = address;
                        this.accounts = address ? [address] : [];
                        this.#emit('accountsChanged', this.accounts);
                    },
                });
                this.#unwatchFns.push(unwatchAcc);
                break;

            case 'chainChanged':
                const unwatchNet = watchAccount(wagmiConfig, {
                    onChange: (account, prevAccount) => {
                        if (account.chainId !== prevAccount.chainId) {
                            this.#emit('chainChanged', account.chainId?.toString(16));
                        }
                    },
                });
                this.#unwatchFns.push(unwatchNet);
                break;

            default:
                console.warn(`Unsupported event: ${event}`);
        }
    }

    #emit(event: string, ...args: any[]) {
        this.#listeners[event]?.forEach((listener) => {
            runInSafe(() => listener(...args));
        });
    }

    removeAllListeners(): void {
        this.#listeners = {};
        this.#unwatchFns.forEach((fn) => fn());
        this.#unwatchFns = [];
    }

    async request<T>(params: JsonRpcRequest): Promise<T> {
        const walletClient = await this.getWalletClient();
        const args = params as unknown as Parameters<typeof walletClient.request>[0];
        return walletClient.request(args);
    }

    async enable(): Promise<void> {
        const client = await this.getWalletClient();
        this.selectedAddress = client.account.address;
        this.accounts = [client.account.address];
    }
}

export class SolanaWalletProvider implements SolanaProvider {
    #provider: (Provider & { publicKey: web3.PublicKey }) | null = null;
    #publicKey: web3.PublicKey | null = null;
    isPhantom = false;
    #listeners: Record<string, Set<(...args: any[]) => void>> = {};
    #unwatchFns: Array<() => void> = [];

    get publicKey() {
        return this.#publicKey!;
    }

    protected async getProvider() {
        if (this.#provider && this.#publicKey) return this.#provider;
        const provider = await getWalletAdaptorRequired();
        this.#provider = provider;
        this.#publicKey = provider.publicKey;
        return provider;
    }

    #emit(event: string, ...args: any[]) {
        this.#listeners[event]?.forEach((listener) => {
            runInSafe(() => listener(...args));
        });
    }

    async disconnect() {
        throw new NotImplementedError();
    }

    async connect() {
        const provider = await this.getProvider();
        this.#publicKey = provider.publicKey;
        this.#emit('connect', provider.publicKey);
        return { publicKey: provider.publicKey };
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T) {
        const provider = await this.getProvider();
        return provider.signAndSendTransaction(transaction);
    }

    async signAllTransactions<T extends web3.Transaction | web3.VersionedTransaction>(transactions: T[]) {
        const provider = await this.getProvider();
        return provider.signAllTransactions(transactions);
    }

    async signMessage(message: Uint8Array) {
        const provider = await this.getProvider();
        return provider.signMessage(message);
    }

    #setupWatcher(event: string) {
        this.getProvider()
            .then((provider) => {
                const hasOn = typeof (provider as any).on === 'function';
                if (!hasOn) return;
                if (event === 'accountChanged') {
                    const handler = (pubKey: web3.PublicKey) => {
                        this.#publicKey = pubKey;
                        this.#emit('accountChanged', pubKey);
                    };
                    provider.on('accountsChanged', handler);
                    this.#unwatchFns.push(() => (provider as any).removeListener?.('accountsChanged', handler));
                } else {
                    const handler = (pubKey: web3.PublicKey) => {
                        if (event === 'connect') this.#publicKey = pubKey ?? provider.publicKey;
                        if (event === 'disconnect') this.#publicKey = null;
                        this.#emit(event, pubKey);
                    };
                    provider.on(event as ProviderEventEmitterMethods.Event, handler as never);
                    this.#unwatchFns.push(() =>
                        provider.removeListener?.(event as ProviderEventEmitterMethods.Event, handler as never),
                    );
                }
            })
            .catch((error) => {
                console.error(`[SolanaWalletProvider] Error setting up watcher for ${event}:`, error);
            });

        if (event === 'accountChanged') {
            const tryEmitAccountChanged = async () => {
                const connected = getWalletAdaptorRequired();
                return connected.then((provider) => {
                    const pk = provider.publicKey;
                    if (!this.#publicKey || pk.toBase58() !== this.#publicKey.toBase58()) {
                        this.#provider = provider as any;
                        this.#publicKey = pk;
                        this.#emit('accountChanged', pk);
                    }
                });
            };

            const unsubscriptionNetwork = useSolanaActiveNetworkStore.subscribe(() => {
                tryEmitAccountChanged().catch(() => null);
            });
            this.#unwatchFns.push(unsubscriptionNetwork);

            const unsubscriptionPrivy = usePrivyWalletStore.subscribe((state) => {
                const address = state.wallets[NetworkType.Solana][0]?.address;
                if (!address) return;
                const pk = new web3.PublicKey(address);
                if (!this.#publicKey || pk.toBase58() !== this.#publicKey.toBase58()) {
                    this.#publicKey = pk;
                    this.#emit('accountChanged', pk);
                }
            });
            this.#unwatchFns.push(unsubscriptionPrivy);
        }
    }

    on(event: string, listener: (...args: any[]) => void) {
        if (!this.#listeners[event]) {
            this.#listeners[event] = new Set();
        }
        this.#listeners[event].add(listener);
        if (this.#listeners[event].size === 1) {
            this.#setupWatcher(event);
        }
    }

    removeListener(event: string, listener?: (...args: any[]) => void) {
        if (!listener) return;
        this.#listeners[event]?.delete(listener);
    }

    removeAllListeners() {
        this.#listeners = {};
        this.#unwatchFns.forEach((fn) => fn());
        this.#unwatchFns = [];
    }
}
