import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';

import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

export function getAnchorProvider(customAdaptor?: ReturnType<typeof getWalletAdaptorConnected>): AnchorProvider {
    const adaptor = customAdaptor ?? getWalletAdaptorConnected();
    const connection = new web3.Connection(
        getSolanaRPCUrl({
            useDevCluster: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled,
            httpUrl: envs.external.NEXT_PUBLIC_SOLANA_RPC_URL,
        }),
        'confirmed',
    );
    const wallet = {
        publicKey: adaptor.publicKey,
        signTransaction: adaptor.signTransaction.bind(adaptor),
        signAllTransactions: adaptor.signAllTransactions.bind(adaptor),
    };

    return new AnchorProvider(connection, wallet);
}
