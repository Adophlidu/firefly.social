import { web3 } from '@coral-xyz/anchor';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';

import { env } from '@/constants/env.js';
import { SOLANA_MAINNET_PRIVY } from '@/constants/solana.js';

function getSolanaConnection(connection?: web3.Connection) {
    return (
        connection ??
        new web3.Connection(getSolanaRPCUrl({ httpUrl: env.external.NEXT_PUBLIC_SOLANA_RPC_URL }), 'confirmed')
    );
}

export async function signAndBroadcastSolanaTransaction(
    wallet: ConnectedStandardSolanaWallet,
    transaction: Uint8Array,
    connection?: web3.Connection,
) {
    const { signedTransaction } = await wallet.signTransaction({
        chain: SOLANA_MAINNET_PRIVY,
        transaction,
    });

    return getSolanaConnection(connection).sendRawTransaction(signedTransaction, {
        preflightCommitment: 'confirmed',
    });
}

export async function signAndBroadcastSolanaTransactions(
    wallet: ConnectedStandardSolanaWallet,
    transactions: Uint8Array[],
    connection?: web3.Connection,
) {
    const rpcConnection = getSolanaConnection(connection);
    const signatures: string[] = [];

    for (const transaction of transactions) {
        const signature = await signAndBroadcastSolanaTransaction(wallet, transaction, rpcConnection);
        signatures.push(signature);
    }

    return signatures;
}
