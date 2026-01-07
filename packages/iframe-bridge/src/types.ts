import type { EvmRpcResult, SolanaRequestArgument, SolanaResponse } from '@/ff-wallet-type.js';

// Simplified Chars type for iframe bridge use
// For full Chars type support, use the main project types
export type Chars = string;

export enum IframeBridgeMethod {
    COMPOSE = 'compose',
    LOGIN = 'login',
    NAVIGATE = 'navigate',
    ENQUEUE_MESSAGE = 'enqueueMessage',
    DOWNLOAD_APP = 'downloadApp',
    FIREFLY_WALLET_NAVIGATE = 'firefly_wallet_navigate',
    FIREFLY_WALLET_EVM_RPC = 'evm_rpc',
    FIREFLY_WALLET_SOLANA_RPC = 'solana_rpc',
    FIREFLY_WALLET_AUTHORIZED = 'firefly_wallet_authorized',
    FIREFLY_WALLET_VISIBILITY = 'firefly_wallet_visibility',
    FIREFLY_WALLET_SIGN_MESSAGE = 'firefly_wallet_sign_message',
    FIREFLY_WALLET_ADD_SESSION_SIGNER = 'firefly_wallet_add_session_signer',
}

export interface IframeBridgeMessage {
    type: 'iframe-bridge-request' | 'iframe-bridge-response';
    method: IframeBridgeMethod;
    id: string;
    params?: unknown;
    payload?: {
        result?: unknown;
        error?: string;
    };
}

export interface IframeBridgeRequestArguments {
    [IframeBridgeMethod.COMPOSE]: {
        text: Chars;
    };
    [IframeBridgeMethod.ENQUEUE_MESSAGE]: {
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        duration?: number;
    };
    [IframeBridgeMethod.LOGIN]: {
        source?: string;
        forceOpen?: boolean;
    };
    [IframeBridgeMethod.DOWNLOAD_APP]: {};
    [IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE]: {
        path: string;
        replace?: boolean;
    };
    [IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]: {
        method: string;
        params?: unknown[] | object;
    };
    [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: SolanaRequestArgument;
    [IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED]: {};
    [IframeBridgeMethod.NAVIGATE]: {
        path: string;
        replace?: boolean;
    };
    [IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY]: {
        visible: boolean;
    };
    [IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE]: {
        chainId: string;
        address: string;
        message: string;
    };
    [IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER]: {
        address: string;
        signers: Array<{
            signerId: string;
            policyIds?: string[];
        }>;
    };
}

export interface IframeBridgeResponseResult {
    [IframeBridgeMethod.COMPOSE]: void;
    [IframeBridgeMethod.ENQUEUE_MESSAGE]: void;
    [IframeBridgeMethod.LOGIN]: void;
    [IframeBridgeMethod.DOWNLOAD_APP]: void;
    [IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE]: void;
    [IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]: EvmRpcResult;
    [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: SolanaResponse;
    [IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED]: void;
    [IframeBridgeMethod.NAVIGATE]: void;
    [IframeBridgeMethod.FIREFLY_WALLET_VISIBILITY]: void;
    [IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE]: string;
    [IframeBridgeMethod.FIREFLY_WALLET_ADD_SESSION_SIGNER]: void;
}
