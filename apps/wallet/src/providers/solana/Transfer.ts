import { web3 } from '@coral-xyz/anchor';
import { env } from '@dimensiondev/envs/wallet';
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
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana';
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
} from '@solana/spl-token';

import { signAndBroadcastSolanaTransaction } from '@/helpers/signAndBroadcastSolanaTransaction.js';
import { getNativeTokenBalance, getTokenBalance } from '@/providers/solana/getTokenBalance.js';
import type { Token, TransactionOptions, TransferProvider } from '@/providers/types/Transfer.js';

const defaultFee = 0.00001 * web3.LAMPORTS_PER_SOL * 1.3; // 0.000008 SOL with a buffer

export class SolanaTransfer implements TransferProvider {
    private _connection = new web3.Connection(
        getSolanaRPCUrl({ httpUrl: env.external.NEXT_PUBLIC_SOLANA_RPC_URL }),
        'confirmed',
    );

    get connection() {
        return this._connection;
    }

    constructor(protected wallet: SolanaProvider) {}

    async transfer(options: TransactionOptions): Promise<string> {
        const { token } = options;

        if (!token || this.isNativeToken(token)) {
            return this.transferNative(options);
        }
        return this.transferContract({ ...options, token });
    }

    isNativeToken(token: Pick<Token, 'id'>): boolean {
        return isZeroAddressSolana(token.id);
    }

    async validateBalance({ token, amount }: TransactionOptions): Promise<boolean> {
        const address = this.wallet.publicKey?.toString();
        if (!address) return false;

        const balanceRes = await getTokenBalance(token, address, solana.id);
        let balance = balanceRes.value;
        if (isZeroAddressSolana(token.id)) {
            const available = minus(balance, defaultFee);
            balance = isLessThan(available, 0) ? '0' : available.toString();
        }

        return !isGreaterThan(rightShift(amount, token.decimals), balance);
    }

    async getTransferTransaction(options: TransactionOptions): Promise<web3.Transaction> {
        if (this.isNativeToken(options.token)) {
            return this.getNativeTransferTransaction(options);
        }
        return this.getSplTransferTransaction(options);
    }

    async validateGas(options: TransactionOptions): Promise<{
        isValid: boolean;
        gas: BigNumber;
    }> {
        const account = this.wallet.publicKey?.toString();
        if (!account) {
            return { isValid: false, gas: ZERO };
        }

        // Parallelize independent RPC calls for better performance
        const [nativeBalance, transaction, blockHash] = await Promise.all([
            getNativeTokenBalance(account, solana.id),
            this.getTransferTransaction(options),
            this.connection.getLatestBlockhash(),
        ]);
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const fees = await transaction.getEstimatedFee(this.connection);
        return {
            isValid: fees ? !isGreaterThan(fees, nativeBalance.value) : false,
            gas: fees ? multipliedBy(fees, 1.3) : ZERO,
        };
    }

    async getAvailableBalance({ token, account: accountOverride }: TransactionOptions): Promise<string> {
        const account = accountOverride ?? this.wallet.publicKey?.toString();
        if (!account) return '0';

        const balanceRes = await getTokenBalance(token, account, solana.id);
        let balance = balanceRes.value;
        if (isZeroAddressSolana(token.id)) {
            const available = minus(balance, defaultFee);
            balance = isLessThan(available, 0) ? '0' : available.toString();
        }
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions): Promise<string> {
        const account = this.wallet.publicKey?.toString();
        if (!account) {
            throw new Error('Wallet not connected');
        }

        const transaction = await this.getNativeTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await signAndBroadcastSolanaTransaction(this.wallet, transaction, this.connection);
        await this.connection.confirmTransaction(signature.toString(), 'processed');
        return signature;
    }

    private async transferContract(options: TransactionOptions): Promise<string> {
        const account = this.wallet.publicKey?.toString();
        if (!account) {
            throw new Error('Wallet not connected');
        }

        const transaction = await this.getSplTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await signAndBroadcastSolanaTransaction(this.wallet, transaction, this.connection);
        await this.connection.confirmTransaction(signature.toString(), 'processed');
        return signature;
    }

    private async getNativeTransferTransaction(options: TransactionOptions) {
        const fromPubkey = this.wallet.publicKey;
        if (!fromPubkey) {
            throw new Error('Wallet not connected');
        }

        return new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey,
                toPubkey: new web3.PublicKey(options.to),
                lamports: parseSolToLamports(options.amount),
            }),
        );
    }

    async getSplTransferTransaction(options: TransactionOptions) {
        const fromPubkey = this.wallet.publicKey;
        if (!fromPubkey) {
            throw new Error('Wallet not connected');
        }

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

    async waitForTransaction(signature: string, _chainId: number): Promise<void> {
        await this.connection.confirmTransaction(signature, 'processed');
    }
}
