interface RpcResponse<T> {
    jsonrpc: '2.0';
    result: T | null;
}

export type GetBalanceResponse = RpcResponse<{ value: number }>;

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
