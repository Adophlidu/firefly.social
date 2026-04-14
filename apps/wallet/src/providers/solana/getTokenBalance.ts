import { isZeroAddressSolana } from '@dimensiondev/web3-utils';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import type { SolanaChainId } from '@/constants/solana.js';
import { solanaRPC } from '@/providers/solana/RPC.js';
import type { Token } from '@/providers/types/Transfer.js';

export async function getNativeTokenBalance(address: string, _chainId: number) {
    const data = await solanaRPC.getBalance(address);
    return { value: data.value.toString() ?? '0' };
}

export async function getSplTokenBalance(tokenAddress: string, address: string, _chainId: number) {
    const programs = await solanaRPC.getProgramAccounts(TOKEN_PROGRAM_ID.toBase58(), {
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
    });

    const tokenProgram = programs.find((program) => {
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
