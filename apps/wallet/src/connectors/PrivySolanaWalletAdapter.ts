'use client';

import { web3 } from '@coral-xyz/anchor';
import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import type { Provider as CoreProvider, RequestArguments } from '@reown/appkit';
import type { AnyTransaction, Provider, TransactionOrVersionedTransaction } from '@reown/appkit-adapter-solana';
import {
    BaseMessageSignerWalletAdapter,
    isVersionedTransaction,
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

import { ProviderEventEmitter } from '@/connectors/ProviderEventEmitter.js';
import { withPinCodeCheck } from '@/helpers/withPinCodeCheck.js';
import { logger } from '@/lib/Logger.js';
import { solanaWalletAddressAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';
import { getPrivyWalletApi } from '@/store/privyWalletApiAtom.js';

const PrivySolanaWalletName = 'Firefly Wallet' as WalletName<'Firefly Wallet'>;

class PrivySolanaWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = PrivySolanaWalletName;
    url = 'https://firefly.social/';
    icon = '/firefly.png';
    supportedTransactionVersions: ReadonlySet<web3.TransactionVersion> = new Set(['legacy', 0]);

    private _connecting: boolean;
    private _publicKey: web3.PublicKey | null = null;
    private _readyState: WalletReadyState = WalletReadyState.Installed;

    constructor() {
        super();

        this._connecting = false;
        this._publicKey = null;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                const address = store.get(solanaWalletAddressAtom);
                if (!address) return false;

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

    async getAccounts() {
        const accounts = compact([store.get(solanaWalletAddressAtom)]);
        return accounts;
    }

    // @ts-ignore
    async sendTransaction(
        transaction: TransactionOrVersionedTransaction<SupportedTransactionVersions>,
        connection?: web3.Connection,
        options: SendTransactionOptions = {},
    ): Promise<web3.TransactionSignature> {
        try {
            if (!this.publicKey) throw new WalletNotConnectedError();

            return await withPinCodeCheck(async (pinCode) => {
                const { hash } = await getPrivyWalletApi().signAndSendSolanaTransaction({
                    transaction: bs58.encode(
                        isVersionedTransaction(transaction)
                            ? Buffer.from(transaction.serialize())
                            : transaction.serialize({
                                  requireAllSignatures: false,
                                  verifySignatures: false,
                              }),
                    ),
                    privy_code_hash: pinCode,
                });

                return hash;
            });
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signAndSendAllTransactions<T extends AnyTransaction[]>(
        transactions: T,
    ): Promise<web3.TransactionSignature[]> {
        if (transactions.length === 0) return [];

        try {
            if (!this.publicKey) throw new WalletNotConnectedError();

            return await withPinCodeCheck(async (pinCode) => {
                const signatures: string[] = [];
                for (const transaction of transactions) {
                    const tx = bs58.encode(
                        isVersionedTransaction(transaction)
                            ? Buffer.from(transaction.serialize())
                            : transaction.serialize({
                                  requireAllSignatures: false,
                                  verifySignatures: false,
                              }),
                    );
                    const { hash } = await getPrivyWalletApi().signAndSendSolanaTransaction({
                        transaction: tx,
                        privy_code_hash: pinCode,
                    });
                    signatures.push(hash);
                }

                return signatures;
            });
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to sign and send transactions', error));
            throw error;
        }
    }

    async signTransaction<T extends web3.Transaction | web3.VersionedTransaction>(transaction: T): Promise<T> {
        try {
            if (!this.publicKey) throw new WalletNotConnectedError();

            return await withPinCodeCheck(async (pinCode) => {
                if (!this.publicKey) throw new WalletNotConnectedError();

                const messageBytes = isVersionedTransaction(transaction)
                    ? transaction.message.serialize()
                    : transaction.compileMessage().serialize();
                const messageBase64 = Buffer.from(messageBytes).toString('base64');
                const { signature: signatureBase64 } = await getPrivyWalletApi().signSolanaMessage({
                    encoding: 'base64',
                    message: messageBase64,
                    privy_code_hash: pinCode,
                });
                const signatureBytes = Buffer.from(signatureBase64, 'base64');
                if (signatureBytes.length !== 64) {
                    throw new WalletError('Invalid signature length');
                }

                if (isVersionedTransaction(transaction)) {
                    transaction.addSignature(this.publicKey, signatureBytes);
                } else {
                    transaction.addSignature(this.publicKey, Buffer.from(signatureBytes));
                }

                return transaction;
            });
        } catch (error: unknown) {
            this.emit('error', new WalletError('Failed to send transaction', error));
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            if (!this.publicKey) throw new WalletNotConnectedError();

            return await withPinCodeCheck(async (pinCode) => {
                const { signature } = await getPrivyWalletApi().signSolanaMessage({
                    encoding: 'base64',
                    message: Buffer.from(message).toString('base64'),
                    privy_code_hash: pinCode,
                });
                const signatureBuffer = Buffer.from(signature, 'base64');
                if (signatureBuffer.length !== 64) {
                    throw new WalletError('Invalid signature length');
                }

                return bs58.decode(bs58.encode(signatureBuffer));
            });
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
    type = 'EXTERNAL' as const;
    public readonly provider = this as CoreProvider;

    public adapter: PrivySolanaWalletAdapter;

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
