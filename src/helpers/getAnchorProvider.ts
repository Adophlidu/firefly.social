import { AnchorProvider } from '@coral-xyz/anchor';
import { ChainId } from '@masknet/web3-shared-solana';
import { type Cluster,clusterApiUrl, Connection } from '@solana/web3.js';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

const resolveCluster = createLookupTableResolver<ChainId, Cluster>(
    {
        [ChainId.Mainnet]: 'mainnet-beta',
        [ChainId.Testnet]: 'testnet',
        [ChainId.Devnet]: 'devnet',
        [ChainId.Invalid]: 'devnet',
    },
    'devnet',
);

export function getAnchorProvider(chainId = ChainId.Mainnet): AnchorProvider {
    const adaptor = getWalletAdaptorConnected();
    const cluster = resolveCluster(chainId);
    const connection = new Connection(clusterApiUrl(cluster), 'confirmed');
    const wallet = {
        publicKey: adaptor.publicKey,
        signTransaction: adaptor.signTransaction,
        signAllTransactions: adaptor.signAllTransactions,
    };

    return new AnchorProvider(connection, wallet);
}
