import { web3 } from '@coral-xyz/anchor';
import { runInSafeAsync } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';

import { requestRPC } from '@/providers/solana/requestRPC.js';
import type { GetTransactionResponse } from '@/providers/types/Solana.js';

interface MethodsBuilder {
    rpc: (options?: web3.ConfirmOptions) => Promise<string>;
}

export async function runRPC(builder: MethodsBuilder) {
    try {
        return await builder.rpc({ commitment: 'confirmed' });
    } catch (error) {
        if (error instanceof web3.TransactionExpiredTimeoutError && error.signature) {
            const result = await runInSafeAsync(() =>
                requestRPC<GetTransactionResponse>(solana.id, {
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
