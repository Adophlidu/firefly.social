import { web3 } from '@coral-xyz/anchor';
import type { EthereumProvider, JsonRpcRequest, SolanaProvider } from '@okxweb3/dex-widget';
import type { Provider } from '@reown/appkit-adapter-solana';
import { type GetWalletClientReturnType, watchAccount } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { NotImplementedError } from '@/constants/error.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';

export class EthereumWalletProvider implements EthereumProvider {
    #walletClient: GetWalletClientReturnType | null = null;
    #listeners: Record<string, Set<(...args: any[]) => void>> = {};
    #unwatchFns: Array<() => void> = [];

    selectedAddress = '';
    accounts: string[] = [];

    async getWalletClient(): Promise<Exclude<GetWalletClientReturnType, null>> {
        if (this.#walletClient) return this.#walletClient;
        const walletClient = await getWalletClientRequired(config);
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
                const unwatchAcc = watchAccount(config, {
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
                const unwatchNet = watchAccount(config, {
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
            try {
                listener(...args);
            } catch (e) {
                console.error(`Error in ${event} listener:`, e);
            }
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

    async disconnect() {
        throw new NotImplementedError();
    }

    async connect() {
        const provider = await this.getProvider();
        return { publicKey: provider.publicKey };
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T) {
        const provider = await this.getProvider();
        return provider.signAndSendTransaction(transaction);
    }

    async signAllTransactions<T extends web3.Transaction | web3.VersionedTransaction>(transactions: T[]) {
        return await Promise.all(transactions.map((tx) => this.signTransaction(tx)));
    }

    async signMessage(message: Uint8Array) {
        const provider = await this.getProvider();
        return provider.signMessage(message);
    }

    on(event: string) {
        console.info('SolanaWalletProvider.on:', event);
    }

    removeListener(event: string) {
        console.info('SolanaWalletProvider.removeListener', event);
    }

    removeAllListeners() {
        console.info('SolanaWalletProvider.removeAllListeners');
    }
}
