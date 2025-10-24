import { web3 } from '@coral-xyz/anchor';
import { ConnectedStandardSolanaWallet as ConnectedSolanaWallet } from '@privy-io/react-auth/solana';
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
    WalletNotReadyError,
    WalletReadyState,
} from '@solana/wallet-adapter-base';
import { first } from 'lodash-es';

import { getPrivyBridge } from '@/connectors/PrivyConnector.js';
import { NetworkType } from '@/constants/enum.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';

function getWallet(): ConnectedSolanaWallet | null {
    if (typeof window === 'undefined') return null;
    const wallet = first(usePrivyWalletStore.getState().wallets[NetworkType.Solana]);
    return wallet ?? null;
}

export const PrivySolanaWalletName = 'Firefly Wallet' as WalletName<'Firefly Wallet'>;

export class PrivySolanaWalletAdapter extends BaseWalletAdapter {
    name = PrivySolanaWalletName;
    url = 'https://firefly.social/';
    icon = '/firefly.png';
    supportedTransactionVersions: ReadonlySet<web3.TransactionVersion> = new Set(['legacy', 0]);

    private _connecting = false;
    private _wallet: ConnectedSolanaWallet | null = null;
    private _publicKey: web3.PublicKey | null = null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor() {
        super();
        this._wallet = getWallet();

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                const wallet = getWallet();
                this._wallet = wallet;

                if (wallet?.address) {
                    this._readyState = WalletReadyState.Installed;
                    this._publicKey = new web3.PublicKey(wallet.address);
                    this.emit('readyStateChange', this._readyState);
                    this.emit('connect', this._publicKey);
                }

                return !!wallet;
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
        if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();
        try {
            this._wallet = getWallet();
            if (this._wallet) {
                this._publicKey = new web3.PublicKey(this._wallet.address);
                this._connecting = true;
                this.emit('connect', this._publicKey);
            } else {
                throw new WalletNotConnectedError();
            }
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to connect', error));
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            this._wallet?.disconnect();
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to disconnect', error));
            throw error;
        } finally {
            this._wallet = null;
            this._publicKey = null;
            this._connecting = false;
            this.emit('disconnect');
        }
    }

    // @ts-ignore
    async sendTransaction(
        transaction: TransactionOrVersionedTransaction<SupportedTransactionVersions>,
        connection: web3.Connection,
        options: SendTransactionOptions = {},
    ): Promise<web3.TransactionSignature> {
        const wallet = this._wallet;
        const privyBridge = getPrivyBridge();

        if (!wallet || !privyBridge) {
            const error = new WalletNotConnectedError();
            this.emit('error', error);
            throw error;
        }

        try {
            const result = await privyBridge.sendTransactionWithSolana({
                transaction,
                connection,
                address: wallet.address,
            });
            return result.signature;
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        const wallet = this._wallet;
        const privyBridge = getPrivyBridge();

        if (!wallet || !privyBridge) {
            const error = new WalletNotConnectedError();
            this.emit('error', error);
            throw error;
        }

        try {
            const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
            const signedTransaction = await privyBridge.signTransactionWithSolana({
                transaction,
                connection,
                address: wallet.address,
            });
            return web3.Transaction.from(signedTransaction) as T;
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to sign transaction', error));
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        const wallet = this._wallet;
        const privyBridge = getPrivyBridge();

        if (!wallet || !privyBridge) {
            const error = new WalletNotConnectedError();
            this.emit('error', error);
            throw error;
        }

        try {
            return await privyBridge.signMessageWithSolana({
                message,
            });
        } catch (error: any) {
            this.emit('error', new WalletError('Failed to sign message', error));
            throw error;
        }
    }
}

export class PrivySolanaWalletProvider implements Provider {
    id = 'privy';
    name = 'PrivySolanaWalletName';
    chain = 'solana' as const;
    chains = [];
    type = 'ANNOUNCED' as const;
    provider: Provider | null = null;

    get publicKey() {
        const wallet = getWallet();
        if (!wallet) return;
        return new web3.PublicKey(wallet.address);
    }

    async connect(): Promise<string> {
        const wallet = getWallet();
        if (!wallet) throw new WalletNotConnectedError();
        return wallet.address;
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
        const wallet = getWallet();
        const address = wallet?.address;
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
        const wallet = getWallet();
        const privyBridge = getPrivyBridge();
        if (!wallet || !privyBridge) {
            throw new WalletNotConnectedError();
        }
        const result = await privyBridge.sendTransactionWithSolana({
            transaction,
            connection,
            address: wallet.address,
        });
        return result.signature;
    }

    async signAllTransactions<T extends AnyTransaction[]>(transactions: T): Promise<T> {
        const wallet = getWallet();
        const privyBridge = getPrivyBridge();
        if (!wallet || !privyBridge) {
            throw new WalletNotConnectedError();
        }
        return (await privyBridge.signAllTransactionsWithSolana(transactions)) as T;
    }

    async signAndSendTransaction<T extends web3.Transaction | web3.VersionedTransaction>(
        transaction: T,
    ): Promise<web3.TransactionSignature> {
        const result = await this.signTransaction(transaction);
        const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
        return this.sendTransaction(result, connection);
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        const wallet = getWallet();
        const privyBridge = getPrivyBridge();
        if (!wallet || !privyBridge) {
            throw new WalletNotConnectedError();
        }
        return await privyBridge.signMessageWithSolana({
            message,
        });
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        const wallet = getWallet();
        const privyBridge = getPrivyBridge();

        if (!wallet || !privyBridge) {
            throw new WalletNotConnectedError();
        }
        const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
        const signedTransaction = await privyBridge.signTransactionWithSolana({
            transaction,
            connection,
            address: wallet.address,
        });
        return web3.Transaction.from(signedTransaction) as T;
    }
}

export const PrivySolanaProvider = new PrivySolanaWalletProvider();
