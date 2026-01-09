import { type web3 } from '@coral-xyz/anchor';

import { getReadonlyProgram } from '@/providers/solana/red-packet/getReadonlyProgram.js';

export async function getRedPacket(accountId: web3.PublicKey) {
    const program = getReadonlyProgram();
    const redPacket = await program.account.redPacket.fetch(accountId);
    return redPacket;
}
