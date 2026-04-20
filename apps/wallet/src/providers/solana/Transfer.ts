import { web3 } from '@coral-xyz/anchor';
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
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
} from '@solana/spl-token';
import type { BigNumber } from 'bignumber.js';

import { env } from '@/constants/env.js';
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

    constructor(protected wallet: ConnectedStandardSolanaWallet) {}

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
        const balanceRes = await getTokenBalance(token, this.wallet.address, solana.id);
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
        const account = this.wallet.address;
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
        const account = accountOverride ?? this.wallet.address;
        const balanceRes = await getTokenBalance(token, account, solana.id);
        let balance = balanceRes.value;
        if (isZeroAddressSolana(token.id)) {
            const available = minus(balance, defaultFee);
            balance = isLessThan(available, 0) ? '0' : available.toString();
        }
        return leftShift(balance, token.decimals).toString();
    }

    private async transferNative(options: TransactionOptions): Promise<string> {
        const account = this.wallet.address;

        const transaction = await this.getNativeTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await signAndBroadcastSolanaTransaction(
            this.wallet,
            new Uint8Array(
                transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false,
                }),
            ),
            this.connection,
        );
        await this.connection.confirmTransaction(signature.toString(), 'processed');
        return signature;
    }

    private async transferContract(options: TransactionOptions): Promise<string> {
        const account = this.wallet.address;

        const transaction = await this.getSplTransferTransaction(options);
        const blockHash = await this.connection.getLatestBlockhash();
        transaction.feePayer = new web3.PublicKey(account);
        transaction.recentBlockhash = blockHash.blockhash;

        const signature = await signAndBroadcastSolanaTransaction(
            this.wallet,
            new Uint8Array(
                transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false,
                }),
            ),
            this.connection,
        );
        await this.connection.confirmTransaction(signature.toString(), 'processed');
        return signature;
    }

    private async getNativeTransferTransaction(options: TransactionOptions) {
        return new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: new web3.PublicKey(this.wallet.address),
                toPubkey: new web3.PublicKey(options.to),
                lamports: parseSolToLamports(options.amount),
            }),
        );
    }

    async getSplTransferTransaction(options: TransactionOptions) {
        const fromPubkey = new web3.PublicKey(this.wallet.address);
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
