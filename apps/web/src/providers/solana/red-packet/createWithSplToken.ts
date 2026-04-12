import { BN, web3 } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { CreateWithSplTokenContext } from '@/providers/solana/red-packet/types.js';

export async function createWithSplToken(context: CreateWithSplTokenContext) {
    const program = getProgram();
    const creator = getCreator();
    const createTime = Math.floor(Date.now() / 1000);
    const [splTokenRedPacket] = web3.PublicKey.findProgramAddressSync(
        [creator.toBuffer(), Buffer.from(new BN(createTime).toArray('le', 8))],
        program.programId,
    );

    const vault = getAssociatedTokenAddressSync(context.tokenMint, splTokenRedPacket, true, context.tokenProgram);

    const signature = await runRPC(
        program.methods
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
                signer: creator,
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
