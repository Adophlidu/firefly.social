import { envs } from '@dimensiondev/envs/wallet';

import { JsonRPC } from '@/lib/JsonRpc.js';

export interface SolanaRPCInterface {
    getBalance: (address: string) => Promise<{ value: number }>;
    getProgramAccounts: (
        address: string,
        payload: {
            encoding: 'jsonParsed';
            filters: [
                {
                    dataSize: 165;
                },
                {
                    memcmp: {
                        offset: 32;
                        bytes: string;
                    };
                },
            ];
        },
    ) => Promise<ProgramAccount[]>;
}

export interface TokenAccount {
    isNative: false;
    mint: string;
    owner: string;
    state: string;
    tokenAmount: {
        amount: number;
        decimals: number;
        uiAmount: number;
        uiAmountString: string;
    };
}

interface ProgramAccount {
    account: {
        data: {
            parsed: {
                info: TokenAccount;
            };
            program: 'spl-token';
            space: number;
        };
        executable: boolean;
        lamports: number;
        owner: string;
        rentEpoch: string;
    };
    pubkey: string;
}

export const solanaRPC = JsonRPC.createProxy<SolanaRPCInterface>(envs.external.NEXT_PUBLIC_SOLANA_RPC_URL);
