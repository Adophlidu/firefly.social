import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import type { GetBalanceResponse, GetProgramAccountsResponse } from '@/providers/types/Solana.js';
import type { Token } from '@/providers/types/Transfer.js';
import type { SolanaChainId } from '@/web3-shared/solana/types.js';

export async function getNativeTokenBalance(address: string, chainId: number) {
    const data = await requestRPC<GetBalanceResponse>(chainId, {
        method: 'getBalance',
        params: [address],
    });
    return { value: data.result?.value.toString() ?? '0' };
}

export async function getSplTokenBalance(tokenAddress: string, address: string, chainId: number) {
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
                            bytes: address,
                        },
                    },
                ],
            },
        ],
    });

    const tokenProgram = programs.result?.find((program) => {
        const account = program.account.data.parsed.info;
        if (account.tokenAmount.decimals === 0) return false;
        return account.mint === tokenAddress;
    });

    return tokenProgram?.account.data.parsed.info;
}

export async function getTokenBalance(token: Pick<Token<SolanaChainId>, 'id'>, address: string, chainId: number) {
    if (isZeroAddressSolana(token.id)) return getNativeTokenBalance(address, chainId);

    const tokenAccount = await getSplTokenBalance(token.id, address, chainId);
    return {
        value: tokenAccount?.tokenAmount.amount.toString() || '0',
    };
}
