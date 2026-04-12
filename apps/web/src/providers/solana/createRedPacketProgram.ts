/* cspell:disable */

import { Program, web3 } from '@coral-xyz/anchor';

import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { getAnchorProvider } from '@/helpers/getAnchorProvider.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import type { Redpacket } from '@/idls/redpacket.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';
import type { SolanaChainId } from '@/web3-shared/solana/types.js';

const storage = new Map<string, Program<Redpacket>>();

export function createRedPacketProgram(
    chainId: SolanaChainId,
    requireWallet = false,
    forcePrivy = false,
): Program<Redpacket> {
    const provider = forcePrivy
        ? (privySolanaProvider as ReturnType<typeof getWalletAdaptorConnected>)
        : getWalletAdaptorConnected();

    const key = `${chainId}-${requireWallet}-${forcePrivy}-${provider.name}-${provider.publicKey.toBase58()}`;
    const hit = storage.get(key);
    if (hit) return hit;

    if (requireWallet) {
        const program = new Program<Redpacket>(RedPacketIDL, getAnchorProvider(provider));
        storage.set(key, program);
        return program;
    }
    const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
    const program = new Program<Redpacket>(RedPacketIDL, { connection });
    return program;
}
