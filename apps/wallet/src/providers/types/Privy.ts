import type { Response } from '@/providers/types/Firefly.js';

export interface EvmTransaction {
    from: string;
    to: string;
    chain_id: string;
    nonce?: number;
    data?: string;
    value?: string;
    type?: 0 | 1 | 2 | 4;
    gas_limit: string;
    gas?: string;
    gasPrice: string;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
}

export interface TypedData {
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
    };
    message: Record<string, any>;
    primaryType: string;
    types: Record<string, Array<{ name: string; type: string }>>;
}

export type SignEncoding = 'utf-8' | 'hex';

export interface LinkedAccount {
    address: string;
    chain_id: `solana:${string}` | `eip155:${number}`;
    chain_type: 'solana' | 'ethereum';
    connector_type: 'embedded';
    delegated: boolean;
    first_verified_at: number;
    id: string | null;
    imported: boolean;
    latest_verified_at: number;
    public_key: string | null;
    recovery_method: 'privy-v2';
    type: 'wallet';
    verified_at: number;
    wallet_client: 'privy';
    wallet_client_type: 'privy';
    wallet_index: number;
}

// #region Api request types EVM
export interface PersonalSignRequest {
    message: string;
    encoding?: SignEncoding;
    privy_code_hash?: string;
}

export interface SignEvmTransactionRequest {
    transaction: EvmTransaction;
    privy_code_hash?: string;
}

export interface SignEip712TypedDataRequest {
    json_str: string;
    privy_code_hash?: string;
}

export interface SendEvmTransactionRequest {
    transaction: EvmTransaction;
    privy_code_hash?: string;
}

// #endregion

// #region Api response types EVM
export type PersonalSignResponse = Response<{
    signature: string;
    encoding: SignEncoding;
}>;

export type SignEvmTransactionResponse = Response<{
    signedTransaction: string;
    encoding: string;
}>;

export type SignEip712TypedDataResponse = Response<{
    signature: string;
    encoding: string;
}>;

export type SendEvmTransactionResponse = Response<{
    hash: string;
    caip2: string;
    transaction_id: string;
}>;

export type GetPrivyUserResponse = Response<{
    id: string;
    created_at: number;
    has_accepted_terms: boolean;
    linked_accounts: LinkedAccount[];
}>;
// #endregion

// #region Api request types Solana
export interface SignSolanaMessageRequest {
    message: string;
    encoding: 'utf-8' | 'base64';
    privy_code_hash?: string;
}

export interface SignSolanaTransactionRequest {
    transaction: string; // base64;
    encoding: 'base64';
    privy_code_hash?: string;
}

export interface SendSolanaTransactionRequest {
    transaction: string; // base58 encoded transaction
    privy_code_hash?: string;
}
// #endregion

// #region Api response types Solana
export type SignSolanaMessageResponse = Response<{
    signature: string;
    encoding: 'utf-8' | 'base64';
}>;

export type SignSolanaTransactionResponse = Response<{
    signed_transaction: string;
    encoding: 'base64';
}>;

export type SendSolanaTransactionResponse = Response<{
    hash: string;
    caip2: string;
    transaction_id: string;
}>;
// #endregion
