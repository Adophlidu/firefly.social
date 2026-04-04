import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { requestRPC } from '@/providers/solana/requestRPC.js';
import { type GetBalanceResponse } from '@/providers/types/Solana.js';
import { type Token } from '@/providers/types/Transfer.js';
import { type SolanaChainId } from '@/web3-shared/solana/types.js';

interface TokenAccountsByOwnerResponse {
    result?: {
        value?: Array<{
            account?: {
                data?: {
                    parsed?: {
                        info?: {
                            tokenAmount?: { amount: string; decimals: number; uiAmountString: string };
                            mint?: string;
                        };
                    };
                };
            };
        }>;
    };
}

export async function getNativeTokenBalance(address: string, chainId: number) {
    const data = await requestRPC<GetBalanceResponse>(chainId, {
        method: 'getBalance',
        params: [address],
    });
    return { value: data.result?.value.toString() ?? '0' };
}

export async function getSplTokenBalance(tokenAddress: string, address: string, chainId: number) {
    const programIds = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];

    for (const programId of programIds) {
        const accounts = await requestRPC<TokenAccountsByOwnerResponse>(chainId, {
            method: 'getTokenAccountsByOwner',
            params: [
                address,
                { mint: tokenAddress },
                {
                    programId: programId.toBase58(),
                    encoding: 'jsonParsed',
                },
            ],
        });

        const accountInfo = accounts.result?.value?.[0]?.account?.data?.parsed?.info;
        if (accountInfo?.tokenAmount?.decimals !== undefined) {
            return accountInfo;
        }
    }

    return;
}

export async function getTokenBalance(token: Pick<Token<SolanaChainId>, 'id'>, address: string, chainId: number) {
    if (isZeroAddressSolana(token.id)) return getNativeTokenBalance(address, chainId);

    const tokenAccount = await getSplTokenBalance(token.id, address, chainId);
    return {
        value: tokenAccount?.tokenAmount?.amount?.toString() ?? '0',
    };
}
