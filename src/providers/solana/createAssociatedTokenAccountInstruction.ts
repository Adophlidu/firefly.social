import { web3 } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export function createAssociatedTokenAccountInstruction(
    payer: web3.PublicKey,
    associatedToken: web3.PublicKey,
    owner: web3.PublicKey,
    mint: web3.PublicKey,
    programId: web3.PublicKey = TOKEN_PROGRAM_ID,
    associatedTokenProgramId: web3.PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID,
): web3.TransactionInstruction {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedToken, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new web3.TransactionInstruction({
        keys,
        programId: associatedTokenProgramId,
        data: Buffer.alloc(0),
    });
}
