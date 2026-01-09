import { web3 } from '@coral-xyz/anchor';

import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import { type GetTransactionResponse } from '@/providers/types/Solana.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface MethodsBuilder {
    rpc: (options?: web3.ConfirmOptions) => Promise<string>;
}

export async function runRPC(builder: MethodsBuilder) {
    try {
        return await builder.rpc({ commitment: 'confirmed' });
    } catch (error) {
        if (error instanceof web3.TransactionExpiredTimeoutError && error.signature) {
            const result = await runInSafeAsync(() =>
                requestRPC<GetTransactionResponse>(SolanaChainId.Mainnet, {
                    method: 'getTransaction',
                    params: [error.signature, 'jsonParsed'],
                }),
            );
            if (result?.result && result.result.meta?.status?.Ok === null) {
                return error.signature;
            }
        }
        throw error;
    }
}
