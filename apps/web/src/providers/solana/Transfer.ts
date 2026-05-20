import { web3 } from '@coral-xyz/anchor';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { solana } from '@dimensiondev/web3/chains';
import {
    isGreaterThan,
    isLessThan,
    leftShift,
    minus,
    multipliedBy,
    rightShift,
    ZERO,
} from '@dimensiondev/web3/numbers';
import { getSolanaRPCUrl, isZeroAddressSolana, parseSolToLamports } from '@dimensiondev/web3/utils';
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
} from '@solana/spl-token';

import { getNativeTokenBalance, getTokenBalance } from '@/providers/solana/getTokenBalance.js';
import { getWalletAdapter } from '@/providers/solana/getWalletAdapter.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import type { Token, TransactionOptions, TransferProvider } from '@/providers/types/Transfer.js';

const defaultFee = 0.00001 * web3.LAMPORTS_PER_SOL * 1.3; // 0.000008 SOL with a buffer

class Provider implements TransferProvider {
    private _connection = new web3.Connection(
        getSolanaRPCUrl({
            useDevCluster: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled,
            httpUrl: envs.external.NEXT_PUBLIC_SOLANA_RPC_URL,
        }),
        'confirmed',
    );

    get connection() {
        return this._connection;
    }

    async transfer(options: TransactionOptions): Promise<string> {
        const { token } = options;

        await SolanaNetwork.connect();

        const signature =
            !token || this.isNativeToken(token)
                ? await this.transferNative(options)
                : await this.transferContract({ ...options, token });

        return signature;
    }

    isNativeToken(token: Token): boolean {
        return isZeroAddressSolana(token.id);
    }

    async validateBalance({ token, amount }: TransactionOptions): Promise<boolean> {
        const balanceRes = await getTokenBalance(token, await SolanaNetwork.getAccount(), solana.id);
        let balance = balanceRes.value;
        if (isZeroAddressSolana(token.id)) {
            const available = minus(balance, defaultFee);
            balance = isLessThan(available, 0) ? '0' : available.toString();
        }

        return !isGreaterThan(rightShift(amount, token.decimals), balance);
    }

    async getTransferTransaction(options: TransactionOptions) {
        return this.isNativeToken(options.token)
            ? this.getNativeTransferTransaction(options)
            : this.getSplTransferTransaction(options);
    }

    async validateGas(options: TransactionOptions) {
        const account = await SolanaNetwork.getAccount();
        const nativeBalance = await getNativeTokenBalance(account, solana.id);
        const transaction = await this.getTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const fees = await transaction.getEstimatedFee(this.connection);
        return {
            isValid: fees ? !isGreaterThan(fees, nativeBalance.value) : false,
            gas: fees ? multipliedBy(fees, 1.3) : ZERO,
        };
    }

    async getAvailableBalance({ token }: TransactionOptions): Promise<string> {
        const account = await SolanaNetwork.getAccount();
        const balanceRes = await getTokenBalance(token, account, solana.id);
        let balance = balanceRes.value;
        if (isZeroAddressSolana(token.id)) {
            const available = minus(balance, defaultFee);
            balance = isLessThan(available, 0) ? '0' : available.toString();
        }
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions): Promise<string> {
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

    private async transferContract(options: TransactionOptions): Promise<string> {
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

    private async getNativeTransferTransaction(options: TransactionOptions) {
        return new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: new web3.PublicKey(await SolanaNetwork.getAccount()),
                toPubkey: new web3.PublicKey(options.to),
                lamports: parseSolToLamports(options.amount),
            }),
        );
    }

    async getSplTransferTransaction(options: TransactionOptions) {
        const fromPubkey = new web3.PublicKey(await SolanaNetwork.getAccount());
        const toPubkey = new web3.PublicKey(options.to);
        const mintPubkey = new web3.PublicKey(options.token.id);
        const tokenAmount = Number.parseInt(rightShift(options.amount, options.token.decimals).toString(), 10);

        const transaction = new web3.Transaction();
        const ata = await getAssociatedTokenAddress(mintPubkey, toPubkey);
        const info = await this.connection.getAccountInfo(ata);
        if (!info) {
            transaction.add(createAssociatedTokenAccountInstruction(fromPubkey, ata, toPubkey, mintPubkey));
        }
        const fromATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
        transaction.add(createTransferInstruction(fromATA, ata, fromPubkey, tokenAmount));
        return transaction;
    }

    async waitForTransaction(signature: string, chainId: number): Promise<void> {
        await this.connection.confirmTransaction(signature, 'processed');
    }
}

export const SolanaTransfer = new Provider();
