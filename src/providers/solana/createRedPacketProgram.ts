/* cspell:disable */

import { Program } from '@coral-xyz/anchor';
import type { ChainId } from '@masknet/web3-shared-solana';

import { getAnchorProvider } from '@/helpers/getAnchorProvider.js';
import type { Redpacket } from '@/idls/redpacket.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };

export function createRedPacketProgram(chainId: ChainId) {
    return new Program(RedPacketIDL as Redpacket, getAnchorProvider(chainId));
}
