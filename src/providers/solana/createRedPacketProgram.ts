/* cspell:disable */

import { Program } from '@coral-xyz/anchor';
import type { ChainId } from '@masknet/web3-shared-solana';

import { getAnchorProvider } from '@/helpers/getAnchorProvider.js';
import type { Redpacket } from '@/idls/redpacket.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };

const storage = new Map<ChainId, Program<Redpacket>>();

export function createRedPacketProgram(chainId: ChainId) {
    const hit = storage.get(chainId);
    if (hit) return hit;

    const program = new Program(RedPacketIDL as Redpacket, getAnchorProvider(chainId));
    storage.set(chainId, program);
    return program;
}
