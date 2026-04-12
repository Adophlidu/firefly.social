import { web3 } from '@coral-xyz/anchor';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes/index.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { getTokenProgramFromVault } from '@/providers/solana/red-packet/getTokenProgramFromVault.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { ClaimSplTokenContext } from '@/providers/solana/red-packet/types.js';

export async function claimWithSplToken(context: ClaimSplTokenContext) {
    const {
        accountId,
        publicKey,
        message,
        signedMessage,
        tokenAddress,
        chainId,
        tokenProgram: tokenProgramString,
    } = context;
    if (!publicKey || !message) {
        throw new Error('Public key and message are required');
    }
    const program = getProgram(true);
    const receiver = getCreator(true);
    const tokenMint = new web3.PublicKey(tokenAddress);

    const tokenProgram = tokenProgramString
        ? new web3.PublicKey(tokenProgramString)
        : await getTokenProgramFromVault(chainId, accountId, tokenMint);
    if (!tokenProgram) throw new Error('Token program not found');
    const receiverTokenAccount = getAssociatedTokenAddressSync(tokenMint, receiver, true, tokenProgram);
    const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, tokenProgram);
    const publicKeyBytes = new web3.PublicKey(publicKey).toBytes();
    const messageBuffer = Buffer.from(message, 'base64');
    const ed25519Instruction = web3.Ed25519Program.createInstructionWithPublicKey({
        publicKey: publicKeyBytes,
        message: messageBuffer,
        signature: bs58.decode(signedMessage),
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
