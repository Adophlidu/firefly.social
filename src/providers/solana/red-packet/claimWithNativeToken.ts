import { web3 } from '@coral-xyz/anchor';
import { sign } from 'tweetnacl';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { ClaimNativeTokenContext } from '@/providers/solana/red-packet/types.js';

export async function claimWithNativeToken(context: ClaimNativeTokenContext) {
    const program = getProgram();
    const receiver = getCreator();
    const { accountId, claimer } = context;

    const message = Buffer.concat([accountId.toBuffer(), receiver.toBuffer()]);

    const claimerSignature = sign.detached(message, claimer.secretKey);
    const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
        message,
        publicKey: claimer.publicKey.toBytes(),
        signature: claimerSignature,
    });

    const signature = await runRPC(
        program.methods
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
