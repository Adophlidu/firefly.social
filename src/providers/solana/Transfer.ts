import { web3 } from '@coral-xyz/anchor';
import { createTransferInstruction } from '@solana/spl-token';

import { formatBalance } from '@/helpers/formatBalance.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { isGreaterThan, rightShift } from '@/helpers/number.js';
import { parseSolToLamports } from '@/helpers/parseSolToLamports.js';
import { getOrCreateAssociatedTokenAccount } from '@/providers/solana/getOrCreateAssociatedTokenAccount.js';
import { getNativeTokenBalance, getTokenBalance } from '@/providers/solana/getTokenBalance.js';
import { getWalletAdapter } from '@/providers/solana/getWalletAdapter.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import type { Token, TransactionOptions, TransferProvider } from '@/providers/types/Transfer.js';
import { SolanaChainId } from '#masknet/web3-shared-solana';

class Provider implements TransferProvider<SolanaChainId> {
    private _connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');

    get connection() {
        return this._connection;
    }

    async transfer(options: TransactionOptions<SolanaChainId>): Promise<string> {
        const { token } = options;

        await SolanaNetwork.connect();

        const signature =
            !token || this.isNativeToken(token)
                ? await this.transferNative(options)
                : await this.transferContract({ ...options, token });

        return signature;
    }

    isNativeToken(token: Token<SolanaChainId>): boolean {
        return isZeroAddressSolana(token.id);
    }

    async validateBalance({ token, amount }: TransactionOptions<SolanaChainId>): Promise<boolean> {
        const balance = await getTokenBalance(token, await SolanaNetwork.getAccount(), SolanaChainId.Mainnet);
        return !isGreaterThan(rightShift(amount, token.decimals), balance.value);
    }

    async getTransferTransaction(options: TransactionOptions<SolanaChainId>) {
        return this.isNativeToken(options.token)
            ? await this.getNativeTransferTransaction(options)
            : await this.getSplTransferTransaction(options);
    }

    async validateGas(options: TransactionOptions<SolanaChainId>): Promise<boolean> {
        const account = await SolanaNetwork.getAccount();
        const nativeBalance = await getNativeTokenBalance(account, SolanaChainId.Mainnet);
        const transaction = await this.getTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const fees = await transaction.getEstimatedFee(this.connection);
        return fees ? !isGreaterThan(fees, nativeBalance.value) : false;
    }

    async getAvailableBalance({ token }: TransactionOptions<SolanaChainId>): Promise<string> {
        const account = await SolanaNetwork.getAccount();
        const balance = await getTokenBalance(token, account, SolanaChainId.Mainnet);
        return formatBalance(balance.value, token.decimals, {
            significant: 8,
            isPrecise: true,
            hasSeparators: false,
        });
    }

    private async transferNative(options: TransactionOptions<SolanaChainId>): Promise<string> {
        const adapter = getWalletAdapter();
        const account = await SolanaNetwork.getAccount();

        const transaction = await this.getNativeTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await adapter.sendTransaction(transaction, this.connection);
        await this.connection.confirmTransaction(signature, 'processed');

        return signature;
    }

    private async transferContract(options: TransactionOptions<SolanaChainId>): Promise<string> {
        const adapter = getWalletAdapter();
        const account = await SolanaNetwork.getAccount();

        const transaction = await this.getSplTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await adapter.sendTransaction(transaction, this.connection);
        await this.connection.confirmTransaction(signature, 'processed');

        return signature;
    }

    private async getNativeTransferTransaction(options: TransactionOptions<SolanaChainId>) {
        return new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: new web3.PublicKey(await SolanaNetwork.getAccount()),
                toPubkey: new web3.PublicKey(options.to),
                lamports: parseSolToLamports(options.amount),
            }),
        );
    }

    private async getSplTransferTransaction(options: TransactionOptions<SolanaChainId>) {
        const adapter = getWalletAdapter();
        const accountPublicKey = new web3.PublicKey(await SolanaNetwork.getAccount());

        const recipientPubkey = new web3.PublicKey(options.to);
        const mintPubkey = new web3.PublicKey(options.token.id);
        function signTransaction(transaction: web3.Transaction) {
            return adapter.signTransaction(transaction);
        }
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            accountPublicKey,
            mintPubkey,
            accountPublicKey,
            signTransaction,
        );
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            accountPublicKey,
            mintPubkey,
            recipientPubkey,
            signTransaction,
        );

        return new web3.Transaction().add(
            createTransferInstruction(
                fromTokenAccount.address,
                toTokenAccount.address,
                accountPublicKey,
                Number.parseInt(options.amount, 10),
            ),
        );
    }

    async waitForTransaction(signature: string, chainId: number): Promise<void> {
        await this.connection.confirmTransaction(signature, 'processed');
    }
}

export const SolanaTransfer = new Provider();
