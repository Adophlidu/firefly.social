import { web3 } from '@coral-xyz/anchor';
import { isSameAddress } from '@dimensiondev/web3-utils';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';

interface TokenAccountsByOwnerResponse {
    result?: {
        value?: Array<{
            pubkey?: string;
            account?: {
                data?: {
                    parsed?: {
                        info?: {
                            mint?: string;
                        };
                    };
                };
                owner?: string;
            };
        }>;
    };
}

async function resolver(chainId: number, account: string, mintAddress: string) {
    const programIds = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];

    for (const programId of programIds) {
        const accounts = await requestRPC<TokenAccountsByOwnerResponse>(chainId, {
            method: 'getTokenAccountsByOwner',
            params: [
                account,
                { mint: mintAddress },
                {
                    programId: programId.toBase58(),
                    encoding: 'jsonParsed',
                },
            ],
        });

        const tokenAccount = accounts.result?.value?.[0];
        if (tokenAccount?.pubkey && tokenAccount.account?.owner) {
            const mint = tokenAccount.account.data?.parsed?.info?.mint;
            if (mint && isSameAddress(mint, mintAddress)) {
                return {
                    pubkey: new web3.PublicKey(tokenAccount.pubkey),
                    owner: new web3.PublicKey(tokenAccount.account.owner),
                };
            }
        }
    }

    return null;
}

export const getTokenAccountByMint = memoizePromise(resolver, (...args) => args.join('-'));
