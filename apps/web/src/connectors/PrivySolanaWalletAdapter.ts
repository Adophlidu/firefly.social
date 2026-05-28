'use client';

import { web3 } from '@coral-xyz/anchor';
import { SessionType, WalletSource } from '@dimensiondev/enums';
import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    SolanaMethod,
    type SolanaRequestArgument,
    type SolanaResponse,
} from '@dimensiondev/iframe-bridge';
import { bom } from '@dimensiondev/utils';
import type { Provider as CoreProvider, RequestArguments } from '@reown/appkit';
import type { TransactionOrVersionedTransaction } from '@reown/appkit-adapter-solana';
import type { AnyTransaction, Provider } from '@reown/appkit-utils/solana';
import {
    BaseMessageSignerWalletAdapter,
    scopePollingDetectionStrategy,
    type SendTransactionOptions,
    type SupportedTransactionVersions,
    WalletAccountError,
    WalletError,
    type WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletReadyState,
} from '@solana/wallet-adapter-base';
import bs58 from 'bs58';
import { compact, first } from 'lodash-es';
import { UserRejectedRequestError } from 'viem';

import { FIREFLY_WALLET_IFRAME_ID } from '@/components/FireflyWallet.js';
import { queryClient } from '@/configs/queryClient.js';
import { PRIVY_CONNECTOR_ID, waitForAuthorization } from '@/connectors/PrivyConnector.js';
import { ProviderEventEmitter } from '@/connectors/ProviderEventEmitter.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { logger } from '@/libs/Logger.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

const PrivySolanaWalletName = 'Firefly Wallet' as WalletName<'Firefly Wallet'>;

class PrivySolanaWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = PrivySolanaWalletName;
    url = 'https://firefly.social/';
    icon = '/firefly.png';
    supportedTransactionVersions: ReadonlySet<web3.TransactionVersion> = new Set(['legacy', 0]);

    private _connecting: boolean;
    private _publicKey: web3.PublicKey | null = null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' ? WalletReadyState.Unsupported : WalletReadyState.NotDetected;

    constructor() {
        super();

        this._connecting = false;
        this._publicKey = null;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                const fireflySession = getSessionFromStorage(SessionType.Firefly);
                const walletEl = bom.document?.getElementById(FIREFLY_WALLET_IFRAME_ID);
                if (!fireflySession || !walletEl) return false;

                this._readyState = WalletReadyState.Installed;
                this.emit('readyStateChange', this._readyState);

                return true;
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
        if (this.readyState === WalletReadyState.Installed) {
            await this.connect();
        }
    }

    override async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            logger.info('[privy] solana connect', this.readyState);

            if (this.readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

            this._connecting = true;

            const accounts = await this.getAccounts();
            const account = first(accounts);
            logger.info('[privy] solana accounts', accounts);
            if (!account) throw new WalletAccountError('No privy solana account found.');

            let publicKey: web3.PublicKey;
            try {
                publicKey = new web3.PublicKey(account);
            } catch (error: any) {
                throw new WalletPublicKeyError(error?.message, error);
            }

            this._publicKey = publicKey;
            this.emit('connect', publicKey);
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        logger.info('[privy] solana disconnect');
        this._publicKey = null;
        this.emit('disconnect');
    }

    private async bridgeRequest<M extends SolanaMethod>(params: SolanaRequestArgument<M>) {
        useGlobalState.getState().updateFireflyWalletIsOpen(true);
        if (!useFireflyWalletStore.getState().isAuthorized) {
            await waitForAuthorization();
        }
        return new Promise<SolanaResponse<M>>((resolve, reject) => {
            const unsubscribe = useGlobalState.subscribe((state) => {
                if (!state.fireflyWalletIsOpen) {
                    unsubscribe();
                    reject(new UserRejectedRequestError(new Error()));
                }
            });
            iframeBridgeProvider
                .request(IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC, params satisfies SolanaRequestArgument<M>)
                .then((rpcResult) => {
                    unsubscribe();
                    useGlobalState.getState().updateFireflyWalletIsOpen(false);
                    resolve(rpcResult as SolanaResponse<M>);
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
    }

    async getAccounts() {
        const isLogin = useFireflyProfileStore.getState().currentProfileSession;
        const connected = isLogin
            ? await queryClient.ensureQueryData(queryMyAllConnections).then((res) => res.connected)
            : [];
        const [account] = connected.filter(
            (connection) => connection.source === WalletSource.Privy && connection.platform === 'solana',
        );
        const accounts = compact([account?.address]);
        // this._publicKey = accounts.length > 0 ? new web3.PublicKey(accounts[0]) : null;
        return accounts;
    }

    // @ts-ignore
    async sendTransaction(
        transaction: TransactionOrVersionedTransaction<SupportedTransactionVersions>,
        connection?: web3.Connection,
        options: SendTransactionOptions = {},
    ): Promise<web3.TransactionSignature> {
        try {
            return this.bridgeRequest({
                method: SolanaMethod.SignAndSendTransaction,
                params: {
                    transaction: bs58.encode(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                },
            });
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signAndSendAllTransactions<T extends AnyTransaction[]>(
        transactions: T,
    ): Promise<web3.TransactionSignature[]> {
        return this.bridgeRequest({
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
        });
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        try {
            const serialized = await this.bridgeRequest({
                method: SolanaMethod.SignTransaction,
                params: {
                    transaction: bs58.encode(
                        transaction.serialize({
                            requireAllSignatures: false,
                            verifySignatures: false,
                        }),
                    ),
                },
            });
            const bytes = bs58.decode(serialized);
            if (transaction instanceof web3.VersionedTransaction) {
                return web3.VersionedTransaction.deserialize(bytes) as T;
            }
            return web3.Transaction.from(bytes) as T;
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const signed = await this.bridgeRequest({
                method: SolanaMethod.SignMessage,
                params: {
                    message: bs58.encode(message),
                },
            });
            return bs58.decode(signed);
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to sign message', error));
            throw error;
        }
    }
}

class PrivySolanaWalletProvider extends ProviderEventEmitter implements Provider {
    id = PRIVY_CONNECTOR_ID;
    name = PrivySolanaWalletName;
    chain = 'solana' as const;
    chains = [];
    type = 'ANNOUNCED' as const;
    public readonly provider = this as CoreProvider;

    protected adapter: PrivySolanaWalletAdapter;

    constructor(walletAdapter: PrivySolanaWalletAdapter) {
        super();

        this.adapter = walletAdapter;
    }

    get publicKey() {
        return this.adapter.publicKey ?? undefined;
    }

    get imageId() {
        return PRIVY_CONNECTOR_ID;
    }

    get imageUrl() {
        return '/firefly.png';
    }

    async connect(): Promise<string> {
        try {
            await this.adapter.connect();
            if (!this.adapter.publicKey) throw new WalletNotConnectedError('No public key found after connect');

            this.emit('connect', this.adapter.publicKey);
            return this.adapter.publicKey.toBase58();
        } catch (error) {
            throw new WalletNotConnectedError('Failed to connect to Privy Solana Wallet', error);
        }
    }

    async disconnect(): Promise<void> {
        await this.adapter.disconnect();
        this.emit('disconnect', undefined);
    }

    async getAccounts(): Promise<Array<{ namespace: 'solana'; address: string; type: 'eoa' }>> {
        const account = this.adapter.publicKey;
        if (!account) return [];

        return [
            {
                namespace: this.chain,
                address: account.toBase58(),
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

export const privySolanaWalletAdapter = new PrivySolanaWalletAdapter();
export const privySolanaProvider = new PrivySolanaWalletProvider(privySolanaWalletAdapter);
