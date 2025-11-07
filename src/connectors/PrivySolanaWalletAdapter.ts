import { web3 } from '@coral-xyz/anchor';
import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    SolanaMethod,
    type SolanaRequestArgument,
    type SolanaResponse,
} from '@dimensiondev/iframe-bridge';
import type { RequestArguments } from '@reown/appkit';
import type {
    AnyTransaction,
    Provider,
    ProviderEventEmitterMethods,
    TransactionOrVersionedTransaction,
} from '@reown/appkit-adapter-solana';
import {
    BaseWalletAdapter,
    scopePollingDetectionStrategy,
    type SendTransactionOptions,
    type SupportedTransactionVersions,
    WalletError,
    type WalletName,
    WalletNotConnectedError,
    WalletReadyState,
} from '@solana/wallet-adapter-base';
import bs58 from 'bs58';
import { compact } from 'lodash-es';

import { FIREFLY_WALLET_IFRAME_ID } from '@/components/FireflyWallet.js';
import { queryClient } from '@/configs/queryClient.js';
import { NetworkType, WalletSource } from '@/constants/enum.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

const PrivySolanaWalletName = 'Firefly Wallet' as WalletName<'Firefly Wallet'>;

export class PrivySolanaWalletAdapter extends BaseWalletAdapter {
    name = PrivySolanaWalletName;
    url = 'https://firefly.social/';
    icon = '/firefly.png';
    supportedTransactionVersions: ReadonlySet<web3.TransactionVersion> = new Set(['legacy', 0]);

    private _connecting: boolean;
    private _publicKey: web3.PublicKey | null = null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor() {
        super();

        this._connecting = true;
        this.getAccounts().then((accounts) => {
            this._publicKey = accounts.length > 0 ? new web3.PublicKey(accounts[0]) : null;
            this._connecting = false;
            this.emit('connect', this._publicKey);
        });

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                this._readyState = WalletReadyState.Installed;
                this.emit('readyStateChange', this._readyState);
                return !!document.getElementById(FIREFLY_WALLET_IFRAME_ID);
            });
        }
    }

    emit(message: string, ...args: unknown[]) {
        // @ts-ignore
        super.emit(message, ...args);
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    get publicKey() {
        return this._publicKey;
    }

    override get connected() {
        return !!this.publicKey;
    }

    override async autoConnect(): Promise<void> {
        await this.connect();
    }

    override async connect(): Promise<void> {
        if (this.connected || this.connecting) return;
        console.info('[privy] solana connect');
    }

    async disconnect(): Promise<void> {
        console.info('[privy] solana disconnect');
    }

    async getAccounts() {
        if (!useFireflyProfileStore.getState().currentProfileSession) return [];
        const { connected } = await queryClient.ensureQueryData(queryMyAllConnections);
        const [account] = connected.filter(
            (connection) => connection.source === WalletSource.Privy && connection.platform === 'solana',
        );
        const accounts = compact([account.address]);
        this._publicKey = accounts.length > 0 ? new web3.PublicKey(accounts[0]) : null;
        return accounts;
    }

    // @ts-ignore
    async sendTransaction(
        transaction: TransactionOrVersionedTransaction<SupportedTransactionVersions>,
        connection?: web3.Connection,
        options: SendTransactionOptions = {},
    ): Promise<web3.TransactionSignature> {
        try {
            const signature = (await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC, {
                method: SolanaMethod.SignAndSendTransaction,
                params: {
                    transaction: bs58.encode(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                },
            } satisfies SolanaRequestArgument<SolanaMethod.SignAndSendTransaction>)) as SolanaResponse<SolanaMethod.SignAndSendTransaction>;
            return signature;
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signAndSendAllTransactions<T extends AnyTransaction[]>(
        transactions: T,
    ): Promise<web3.TransactionSignature[]> {
        const signatures = (await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC, {
            method: SolanaMethod.SignAndSendAllTransactions,
            params: {
                transactions: transactions.map((transaction) =>
                    bs58.encode(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                ),
            },
        } satisfies SolanaRequestArgument<SolanaMethod.SignAndSendAllTransactions>)) as SolanaResponse<SolanaMethod.SignAndSendAllTransactions>;
        return signatures;
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const signedTransaction = (await iframeBridgeProvider.request(
                IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC,
                {
                    method: SolanaMethod.SignTransaction,
                    params: {
                        transaction: bs58.encode(
                            transaction.serialize({
                                requireAllSignatures: false,
                                verifySignatures: false,
                            }),
                        ),
                    },
                } satisfies SolanaRequestArgument<SolanaMethod.SignTransaction>,
            )) as SolanaResponse<SolanaMethod.SignTransaction>;
            return web3.Transaction.from(bs58.decode(signedTransaction)) as T;
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const signed = (await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC, {
                method: SolanaMethod.SignMessage,
                params: {
                    message: bs58.encode(message),
                },
            } satisfies SolanaRequestArgument<SolanaMethod.SignMessage>)) as SolanaResponse<SolanaMethod.SignMessage>;
            return bs58.decode(signed);
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to sign message', error));
            throw error;
        }
    }
}

class PrivySolanaWalletProvider implements Provider {
    id = 'privy';
    name = 'PrivySolanaWalletName';
    chain = 'solana' as const;
    chains = [];
    type = 'ANNOUNCED' as const;
    provider: Provider | null = null;

    protected adapter: PrivySolanaWalletAdapter;

    constructor() {
        this.adapter = new PrivySolanaWalletAdapter();
    }

    get publicKey() {
        return this.adapter.publicKey ?? undefined;
    }

    async connect(): Promise<string> {
        const res = await WalletConnectModalRef.openAndWaitForClose({ networkType: NetworkType.Solana });
        if (!res) throw new WalletNotConnectedError();
        const accounts = await this.getAccounts();
        if (!accounts?.[0]?.address) throw new WalletNotConnectedError();
        return accounts?.[0]?.address;
    }

    async disconnect(): Promise<void> {
        throw new Error('Not implemented');
    }

    emit<E extends ProviderEventEmitterMethods.Event>(
        event: E,
        data: ProviderEventEmitterMethods.EventParams[E],
    ): void {
        console.info('emit', event, data);
        throw new Error('Not implemented');
    }

    on<E extends ProviderEventEmitterMethods.Event>(
        event: E,
        listener: (data: ProviderEventEmitterMethods.EventParams[E]) => void,
    ): void {
        console.info('emit', event, listener);
        throw new Error('Not implemented');
    }

    removeListener<E extends ProviderEventEmitterMethods.Event>(
        event: E,
        listener: (data: ProviderEventEmitterMethods.EventParams[E]) => void,
    ): void {
        console.info('emit', event, listener);
        throw new Error('Not implemented');
    }

    async getAccounts(): Promise<Array<{ namespace: 'solana'; address: string; type: 'eoa' }>> {
        const [address] = await this.adapter.getAccounts();
        if (!address) return [];
        return [
            {
                namespace: this.chain,
                address,
                type: 'eoa',
            },
        ];
    }

    async request<T>(args: RequestArguments): Promise<T> {
        throw new Error('Not implemented');
    }

    async sendTransaction<T extends web3.Transaction | web3.VersionedTransaction>(
        transaction: T,
        connection: web3.Connection,
    ): Promise<web3.TransactionSignature> {
        return this.adapter.sendTransaction(transaction, connection);
    }

    async signAllTransactions<T extends AnyTransaction[]>(transactions: T): Promise<T> {
        await this.adapter.signAndSendAllTransactions(transactions);
        return transactions;
    }

    async signAndSendTransaction<T extends web3.Transaction | web3.VersionedTransaction>(
        transaction: T,
    ): Promise<web3.TransactionSignature> {
        return this.adapter.sendTransaction(transaction);
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        return this.adapter.signMessage(message);
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        return this.adapter.signTransaction(transaction);
    }
}

export const PrivySolanaProvider = new PrivySolanaWalletProvider();
