import { BN, web3 } from '@coral-xyz/anchor';
import { multipliedBy } from '@dimensiondev/web3/numbers';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { CreateWithNativeTokenContext } from '@/providers/solana/red-packet/types.js';

export async function createWithNativeToken(context: CreateWithNativeTokenContext) {
    const program = getProgram();
    const creator = getCreator();
    const createTime = Math.round(Date.now() / 1000);
    // the red packet account id
    const nativeTokenRedPacket = web3.PublicKey.findProgramAddressSync(
        [creator.toBuffer(), Buffer.from(new BN(createTime).toArray('le', 8))],
        program.programId,
    )[0];

    const signature = await runRPC(
        program.methods
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
                signer: creator,
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
