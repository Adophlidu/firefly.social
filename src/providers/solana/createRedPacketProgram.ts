/* cspell:disable */

import { Program, web3 } from '@coral-xyz/anchor';

import { getAnchorProvider } from '@/helpers/getAnchorProvider.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import type { Redpacket } from '@/idls/redpacket.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };
import type { SolanaChainId } from '@/web3-shared/solana/types.js';

const storage = new Map<string, Program<Redpacket>>();

export function createRedPacketProgram(chainId: SolanaChainId, requireWallet = false): Program<Redpacket> {
    const key = `${chainId}-${requireWallet}`;
    const hit = storage.get(key);
    if (hit) return hit;

    if (requireWallet) {
        const program = new Program(RedPacketIDL as Redpacket, getAnchorProvider(chainId));
        storage.set(key, program);
        return program;
    }
    const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
    const program = new Program(RedPacketIDL as Redpacket, { connection });
    return program;
}
