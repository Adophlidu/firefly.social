import { BN, web3 } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { sign } from 'tweetnacl';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { multipliedBy } from '@/helpers/number.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { createRedPacketProgram } from '@/providers/solana/createRedPacketProgram.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import type { GetTransactionResponse } from '@/providers/types/Solana.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

/**
 * Context for creating a red packet with native token.
 */
export interface CreateWithNativeTokenContext {
    /** The number of owners of the red packet. */
    owners: number;
    /** The total amount of SOL (LAMPORTS) in the red packet. */
    totalAmount: number;
    /** The duration for which the red packet is valid, in seconds. */
    duration: number;
    /** Indicates if the red packet should be split randomly. */
    ifSpiltRandom: boolean;
    /** The public key used for claim signature. */
    publicKeyForClaimSignature: web3.PublicKey;
    /** An optional message to include with the red packet. */
    message: string;
    /** An optional display name of the author. */
    authorDisplayName: string;
}

export interface CreateWithSplTokenContext extends CreateWithNativeTokenContext {
    tokenMint: web3.PublicKey;
    tokenProgram: web3.PublicKey;
    tokenAccount: web3.PublicKey;
}

export interface ClaimNativeTokenContext {
    accountId: web3.PublicKey;
    claimer: web3.Keypair;
}

export interface ClaimSplTokenContext extends ClaimNativeTokenContext {
    tokenMint: web3.PublicKey;
    tokenProgram: web3.PublicKey;
}

export interface RefundNativeTokenContext {
    accountId: web3.PublicKey;
}

export interface RefundSplTokenContext extends RefundNativeTokenContext {
    tokenMint: web3.PublicKey;
    tokenProgram: web3.PublicKey;
    tokenAccount: web3.PublicKey;
}

type MethodsBuilder = {
    rpc: (options?: web3.ConfirmOptions) => Promise<string>;
};
async function runRPC(builder: MethodsBuilder) {
    try {
        return await builder.rpc({ commitment: 'confirmed' });
    } catch (error) {
        if (error instanceof web3.TransactionExpiredTimeoutError && error.signature) {
            const result = await runInSafeAsync(() =>
                requestRPC<GetTransactionResponse>(SolanaChainId.Mainnet, {
                    method: 'getTransaction',
                    params: [error.signature, 'jsonParsed'],
                }),
            );
            if (result?.result && result.result.meta?.status?.Ok === null) {
                return error.signature;
            }
        }
        throw error;
    }
}

class Provider {
    private get readonlyProgram() {
        return createRedPacketProgram(
            env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? SolanaChainId.Devnet : SolanaChainId.Mainnet,
        );
    }
    private get program() {
        return createRedPacketProgram(
            env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? SolanaChainId.Devnet : SolanaChainId.Mainnet,
            true,
        );
    }

    private get creator() {
        if (!this.program.provider.publicKey) throw new Error('No creator found.');
        return this.program.provider.publicKey;
    }

    async createWithNativeToken(context: CreateWithNativeTokenContext) {
        const createTime = Math.round(Date.now() / 1000);
        // the red packet account id
        const nativeTokenRedPacket = web3.PublicKey.findProgramAddressSync(
            [this.creator.toBuffer(), Buffer.from(new BN(createTime).toArray('le', 8))],
            this.program.programId,
        )[0];

        const signature = await runRPC(
            this.program.methods
                .createRedPacketWithNativeToken(
                    context.owners,
                    new BN(multipliedBy(context.totalAmount, web3.LAMPORTS_PER_SOL).toString()),
                    new BN(createTime),
                    new BN(context.duration),
                    context.ifSpiltRandom,
                    context.publicKeyForClaimSignature,
                    context.authorDisplayName,
                    context.message,
                )
                .accounts({
                    signer: this.creator,
                    // @ts-expect-error missing type
                    redPacket: nativeTokenRedPacket,
                    systemProgram: web3.SystemProgram.programId,
                }),
        );

        return {
            accountId: nativeTokenRedPacket,
            signature,
        };
    }

    async createWithSplToken(context: CreateWithSplTokenContext) {
        const createTime = Math.floor(Date.now() / 1000);
        const [splTokenRedPacket] = web3.PublicKey.findProgramAddressSync(
            [this.creator.toBuffer(), Buffer.from(new BN(createTime).toArray('le', 8))],
            this.program.programId,
        );

        const vault = getAssociatedTokenAddressSync(context.tokenMint, splTokenRedPacket, true, context.tokenProgram);

        const signature = await runRPC(
            this.program.methods
                .createRedPacketWithSplToken(
                    context.owners,
                    new BN(context.totalAmount),
                    new BN(createTime),
                    new BN(context.duration),
                    context.ifSpiltRandom,
                    context.publicKeyForClaimSignature,
                    context.authorDisplayName,
                    context.message,
                )
                .accounts({
                    signer: this.creator,
                    // @ts-expect-error missing type
                    redPacket: splTokenRedPacket,
                    tokenMint: context.tokenMint,
                    tokenAccount: context.tokenAccount,
                    vault,
                    tokenProgram: context.tokenProgram,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                }),
        );

        return {
            accountId: splTokenRedPacket,
            signature,
        };
    }

    async claimWithNativeToken(context: ClaimNativeTokenContext) {
        const receiver = this.creator;
        const { accountId, claimer } = context;

        const message = Buffer.concat([accountId.toBuffer(), receiver.toBuffer()]);

        const claimerSignature = sign.detached(message, claimer.secretKey);
        const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
            message,
            publicKey: claimer.publicKey.toBytes(),
            signature: claimerSignature,
        });

        const signature = await runRPC(
            this.program.methods
                .claimWithNativeToken()
                .accounts({
                    signer: receiver,
                    // @ts-expect-error missing type
                    redPacket: accountId,
                    systemProgram: web3.SystemProgram.programId,
                })
                .preInstructions([ed25519Instruction]),
        );

        return {
            accountId,
            signature,
        };
    }

    async claimWithSplToken(context: ClaimSplTokenContext) {
        const receiver = this.creator;
        const { accountId, claimer, tokenMint, tokenProgram } = context;

        const receiverTokenAccount = getAssociatedTokenAddressSync(tokenMint, receiver, true, tokenProgram);
        const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, tokenProgram);

        const message = Buffer.concat([accountId.toBytes(), receiver.toBytes()]);
        const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
            publicKey: claimer.publicKey.toBytes(),
            message,
            signature: sign.detached(message, claimer.secretKey),
        });

        const signature = await runRPC(
            this.program.methods
                .claimWithSplToken()
                .accounts({
                    signer: receiver,
                    // @ts-expect-error missing type
                    redPacket: accountId,
                    tokenMint,
                    tokenProgram,
                    tokenAccount: receiverTokenAccount,
                    vault,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    instructionSysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                })
                .preInstructions([ed25519Instruction]),
        );

        return { signature, accountId };
    }

    async refundNativeToken(accountId: web3.PublicKey) {
        const signature = await runRPC(
            this.program.methods.withdrawWithNativeToken().accounts({
                // @ts-expect-error missing type
                redPacket: accountId,
                signer: this.creator,
                systemProgram: web3.SystemProgram.programId,
            }),
        );

        return signature;
    }

    async refundSplToken(context: RefundSplTokenContext) {
        const { accountId, tokenMint, tokenAccount, tokenProgram } = context;

        const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, tokenProgram);

        const signature = await runRPC(
            this.program.methods.withdrawWithSplToken().accounts({
                // @ts-expect-error missing type
                redPacket: accountId,
                signer: this.creator,
                vault,
                tokenAccount, // Will be created if it doesn't exist
                tokenMint,
                tokenProgram,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            }),
        );

        return signature;
    }

    async getRedPacket(accountId: web3.PublicKey) {
        const redPacket = await this.readonlyProgram.account.redPacket.fetch(accountId);
        return redPacket;
    }

    async getClaimedRecord(accountId: web3.PublicKey, receiver: web3.PublicKey) {
        try {
            const claimAccount = web3.PublicKey.findProgramAddressSync(
                [Buffer.from('claim_record'), accountId.toBuffer(), receiver.toBuffer()],
                this.program.programId,
            )[0];
            const record = await this.program.account.claimRecord.fetch(claimAccount);
            return record;
        } catch {
            // if no record found an error will be thrown
            return null;
        }
    }

    async getClaimedRecords(accountId: web3.PublicKey) {
        try {
            return await this.program.account.claimRecord.all([
                {
                    memcmp: {
                        offset: 8, // Adjust the offset based on your account structure
                        bytes: accountId.toBase58(),
                    },
                },
            ]);
        } catch {
            return EMPTY_LIST;
        }
    }
}

export const SolanaRedPacket = new Provider();
