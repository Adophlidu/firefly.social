import { web3 } from '@coral-xyz/anchor';

import { getCreator } from '@/providers/solana/red-packet/getCreator.js';
import { getProgram } from '@/providers/solana/red-packet/getProgram.js';
import { runRPC } from '@/providers/solana/red-packet/runRPC.js';

export async function refundNativeToken(accountId: web3.PublicKey) {
    const program = getProgram();
    const creator = getCreator();
    const signature = await runRPC(
        program.methods.withdrawWithNativeToken().accounts({
            // @ts-expect-error missing type
            redPacket: accountId,
            signer: creator,
            systemProgram: web3.SystemProgram.programId,
        }),
    );

    return signature;
}
