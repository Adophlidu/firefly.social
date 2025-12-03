import { web3 } from '@coral-xyz/anchor';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes/index.js';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { ClaimNativeTokenContext } from '@/providers/solana/red-packet/types.js';

export async function claimWithNativeToken(context: ClaimNativeTokenContext) {
    const program = getProgram();
    const receiver = getCreator();
    const { signedMessage, message, publicKey, accountId } = context;

    if (!message || !publicKey) {
        throw new Error('Message and publicKey are required');
    }

    const claimerSignature = bs58.decode(signedMessage);

    const messageBuffer = Buffer.from(message, 'base64');

    const publicKeyBytes = new web3.PublicKey(publicKey).toBytes();

    const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
        message: messageBuffer,
        publicKey: publicKeyBytes,
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
