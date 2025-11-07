interface RpcResponse<T> {
    jsonrpc: '2.0';
    result: T | null;
}

interface TokenAccount {
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

export type GetBalanceResponse = RpcResponse<{ value: number }>;

export type GetProgramAccountsResponse = RpcResponse<ProgramAccount[]>;

export interface SplToken {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
    tags: string[];
    extensions: {
        facebook: string;
        twitter: string;
        website: string;
    };
}

export interface JupToken extends SplToken {
    daily_volume: number;
    created_at: string;
    freeze_authority: string;
    mint_authority: string;
    permanent_delegate: string;
    minted_at: string;
}

export type GetTransactionResponse = RpcResponse<{
    meta: {
        err: string | null;
        fee: number;
        innerInstructions: unknown[];
        postBalances: number[];
        postTokenBalances: unknown[];
        preBalances: number[];
        preTokenBalances: unknown[];
        rewards: unknown[];
        status: {
            Ok: null;
        };
    };
}>;
