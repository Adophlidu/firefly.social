import { Program, web3 } from '@coral-xyz/anchor';
import { SOLANA_RPC_URL } from '@dimensiondev/constants/static';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';

import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { getAnchorProvider } from '@/helpers/getAnchorProvider.js';
import type { Redpacket } from '@/idls/redpacket.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

const storage = new Map<string, Program<Redpacket>>();

export function createRedPacketProgram(chainId: number, requireWallet = false, forcePrivy = false): Program<Redpacket> {
    const provider = forcePrivy
        ? (privySolanaProvider as ReturnType<typeof getWalletAdaptorConnected>)
        : getWalletAdaptorConnected();

    if (!provider.publicKey) throw new WalletNotConnectedError();

    const key = `${chainId}-${requireWallet}-${forcePrivy}-${provider.name}-${provider.publicKey.toBase58()}`;
    const hit = storage.get(key);
    if (hit) return hit;

    if (requireWallet) {
        const program = new Program<Redpacket>(RedPacketIDL, getAnchorProvider(provider));
        storage.set(key, program);
        return program;
    }
    const connection = new web3.Connection(
        getSolanaRPCUrl({
            useDevCluster: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled,
            httpUrl: SOLANA_RPC_URL,
        }),
        'confirmed',
    );
    const program = new Program<Redpacket>(RedPacketIDL, { connection });
    return program;
}
