import { web3 } from '@coral-xyz/anchor';

import { getProgram } from '@/providers/solana/red-packet/getProgram.js';

export async function getClaimedRecord(accountId: web3.PublicKey, receiver: web3.PublicKey) {
    try {
        const program = getProgram();
        const claimAccount = web3.PublicKey.findProgramAddressSync(
            [Buffer.from('claim_record'), accountId.toBuffer(), receiver.toBuffer()],
            program.programId,
        )[0];
        const record = await program.account.claimRecord.fetch(claimAccount);
        return record;
    } catch {
        // if no record found an error will be thrown
        return null;
    }
}
