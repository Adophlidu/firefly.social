import { getProgram } from '@/providers/solana/red-packet/getProgram.js';

/**
 * @param forcePrivy - Force using privy wallet to claim
 */
export function getCreator(forcePrivy = false) {
    const program = getProgram(forcePrivy);
    if (!program.provider.publicKey) throw new Error('No creator found.');
    return program.provider.publicKey;
}
