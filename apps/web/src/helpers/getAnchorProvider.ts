import { AnchorProvider, web3 } from '@coral-xyz/anchor';

import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

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
