import { web3 } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function getAssociatedTokenAddress(
    mint: web3.PublicKey,
    owner: web3.PublicKey,
    allowOwnerOffCurve = false,
    programId: web3.PublicKey = TOKEN_PROGRAM_ID,
    associatedTokenProgramId: web3.PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID,
): Promise<web3.PublicKey> {
    if (!allowOwnerOffCurve && !web3.PublicKey.isOnCurve(owner.toBuffer())) throw new Error('TokenOwnerOffCurveError');

    const [address] = web3.PublicKey.findProgramAddressSync(
        [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        associatedTokenProgramId,
    );

    return address;
}
