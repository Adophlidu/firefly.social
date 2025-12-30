import { web3 } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync,TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { requestRPC } from '@/providers/solana/requestRPC.js';

interface GetAccountInfoResponse {
    result?: {
        value?: {
            owner?: string;
        } | null;
    };
}

/**
 * Determines the token program ID by querying the vault account.
 * Tries both TOKEN_PROGRAM_ID and TOKEN_2022_PROGRAM_ID to find which one the vault uses.
 */
export async function getTokenProgramFromVault(
    chainId: number,
    accountId: web3.PublicKey,
    tokenMint: web3.PublicKey,
): Promise<web3.PublicKey | undefined> {
    const programIds = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];

    for (const programId of programIds) {
        const vault = getAssociatedTokenAddressSync(tokenMint, accountId, true, programId);

        try {
            const accountInfo = await requestRPC<GetAccountInfoResponse>(chainId, {
                method: 'getAccountInfo',
                params: [
                    vault.toBase58(),
                    {
                        encoding: 'jsonParsed',
                    },
                ],
            });

            if (accountInfo.result?.value?.owner) {
                const owner = new web3.PublicKey(accountInfo.result.value.owner);
                if (owner.equals(programId)) {
                    return programId;
                }
            }
        } catch {}
    }

    return;
}
