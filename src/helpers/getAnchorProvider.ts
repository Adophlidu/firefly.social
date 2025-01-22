import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { ChainId } from '@masknet/web3-shared-solana';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

const resolveCluster = createLookupTableResolver<ChainId, web3.Cluster>(
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
    const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
    const wallet = {
        publicKey: adaptor.publicKey,
        signTransaction: adaptor.signTransaction.bind(adaptor),
        signAllTransactions: adaptor.signAllTransactions.bind(adaptor),
    };

    return new AnchorProvider(connection, wallet);
}
