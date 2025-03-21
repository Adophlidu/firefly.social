import { web3 } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import type { GetProgramAccountsResponse } from '@/providers/types/Solana.js';

async function resolver(chainId: number, account: string, mintAddress: string) {
    const programs = await requestRPC<GetProgramAccountsResponse>(chainId, {
        method: 'getProgramAccounts',
        params: [
            TOKEN_PROGRAM_ID.toBase58(),
            {
                encoding: 'jsonParsed',
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: account,
                        },
                    },
                ],
            },
        ],
    });

    const program = programs?.result?.find((program) =>
        isSameAddress(program.account.data.parsed.info.mint, mintAddress),
    );

    return program
        ? {
              pubkey: new web3.PublicKey(program.pubkey),
              owner: new web3.PublicKey(program.account.owner),
          }
        : null;
}

export const getTokenAccountByMint = memoizePromise(resolver, (...args) => args.join('-'));
