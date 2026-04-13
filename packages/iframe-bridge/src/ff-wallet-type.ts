// EVM RPC methods can return various JSON-RPC value types
// According to EIP-1193 and JSON-RPC 2.0 specification
export type EvmRpcResult = string | number | boolean | null | unknown[] | Record<string, unknown>;

export type ComposeResult = Record<string, string | null> | void;

export enum SolanaMethod {
    SignMessage = 'SignMessage',
    SignAndSendTransaction = 'SignAndSendTransaction',
    SignAndSendAllTransactions = 'SignAllTransactions',
    SignTransaction = 'SignTransaction',
}

export interface SolanaRequestArguments {
    [SolanaMethod.SignMessage]: {
        message: string;
    };
    [SolanaMethod.SignAndSendTransaction]: {
        transaction: string;
    };
    [SolanaMethod.SignTransaction]: {
        transaction: string;
    };
    [SolanaMethod.SignAndSendAllTransactions]: {
        transactions: string[];
    };
}

export interface SolanaRequestArgument<M extends SolanaMethod = SolanaMethod> {
    method: M;
    params: {
        [SolanaMethod.SignMessage]: SolanaRequestArguments[SolanaMethod.SignMessage];
        [SolanaMethod.SignAndSendTransaction]: SolanaRequestArguments[SolanaMethod.SignAndSendTransaction];
        [SolanaMethod.SignAndSendAllTransactions]: SolanaRequestArguments[SolanaMethod.SignAndSendAllTransactions];
        [SolanaMethod.SignTransaction]: SolanaRequestArguments[SolanaMethod.SignTransaction];
    }[M];
}

export type SolanaResponse<M extends SolanaMethod = SolanaMethod> = {
    [SolanaMethod.SignMessage]: string;
    [SolanaMethod.SignAndSendTransaction]: string;
    [SolanaMethod.SignTransaction]: string;
    [SolanaMethod.SignAndSendAllTransactions]: string[];
}[M];
