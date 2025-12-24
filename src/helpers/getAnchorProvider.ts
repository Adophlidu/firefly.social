import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { createLookupTableResolver } from '@dimensiondev/utils';

import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const resolveCluster = createLookupTableResolver<SolanaChainId, web3.Cluster>(
    {
        [SolanaChainId.Mainnet]: 'mainnet-beta',
        [SolanaChainId.Testnet]: 'testnet',
        [SolanaChainId.Devnet]: 'devnet',
        [SolanaChainId.Invalid]: 'devnet',
    },
    'devnet',
);

export function getAnchorProvider(customAdaptor?: ReturnType<typeof getWalletAdaptorConnected>): AnchorProvider {
    const adaptor = customAdaptor ?? getWalletAdaptorConnected();
    const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
    const wallet = {
        publicKey: adaptor.publicKey,
        signTransaction: adaptor.signTransaction.bind(adaptor),
        signAllTransactions: adaptor.signAllTransactions.bind(adaptor),
    };

    return new AnchorProvider(connection, wallet);
}
