import { web3 } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { sign } from 'tweetnacl';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { ClaimSplTokenContext } from '@/providers/solana/red-packet/types.js';

export async function claimWithSplToken(context: ClaimSplTokenContext) {
    const program = getProgram();
    const receiver = getCreator();
    const { accountId, publicKey, message, tokenMint, tokenProgram } = context;

    if (!publicKey || !message) {
        throw new Error('Public key and message are required');
    }
    const receiverTokenAccount = getAssociatedTokenAddressSync(tokenMint, receiver, true, tokenProgram);
    const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, tokenProgram);
    const publicKeyBytes = new web3.PublicKey(publicKey).toBytes();
    const messageBuffer = Buffer.from(message, 'base64');
    const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
        publicKey: publicKeyBytes,
        message: messageBuffer,
        signature: sign.detached(messageBuffer, publicKeyBytes),
    });

    const signature = await runRPC(
        program.methods
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
