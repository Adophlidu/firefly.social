import { getProgram } from '@/providers/solana/red-packet/getProgram.js';

export function getCreator() {
    const program = getProgram();
    if (!program.provider.publicKey) throw new Error('No creator found.');
    return program.provider.publicKey;
}
