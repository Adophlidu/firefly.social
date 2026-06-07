import { web3 } from '@coral-xyz/anchor';
import { SOLANA_RPC_URL } from '@dimensiondev/constants/static';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';
import type { AnyTransaction, Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react';

function getSolanaConnection(connection?: web3.Connection) {
    return connection ?? new web3.Connection(getSolanaRPCUrl({ httpUrl: SOLANA_RPC_URL }), 'confirmed');
}

export async function signAndBroadcastSolanaTransaction(
    wallet: SolanaProvider,
    transaction: AnyTransaction,
    connection?: web3.Connection,
) {
    const signedTx = await wallet.signTransaction(transaction);
    const serializedTx = signedTx.serialize();

    return getSolanaConnection(connection).sendRawTransaction(serializedTx, {
        preflightCommitment: 'confirmed',
    });
}

export async function signAndBroadcastSolanaTransactions(
    wallet: SolanaProvider,
    transactions: AnyTransaction[],
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
