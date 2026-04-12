import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';
import type { RefundSplTokenContext } from '@/providers/solana/red-packet/types.js';

export async function refundSplToken(context: RefundSplTokenContext) {
    const program = getProgram();
    const creator = getCreator();
    const { accountId, tokenMint, tokenAccount, tokenProgram } = context;

    const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, tokenProgram);

    const signature = await runRPC(
        program.methods.withdrawWithSplToken().accounts({
            // @ts-expect-error missing type
            redPacket: accountId,
            signer: creator,
            vault,
            tokenAccount, // Will be created if it doesn't exist
            tokenMint,
            tokenProgram,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        }),
    );

    return signature;
}
