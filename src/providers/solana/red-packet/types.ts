import { web3 } from '@coral-xyz/anchor';

/**
 * Context for creating a red packet with native token.
 */
export interface CreateWithNativeTokenContext {
    /** The number of owners of the red packet. */
    owners: number;
    /** The total amount of SOL (LAMPORTS) in the red packet. */
    totalAmount: number;
    /** The duration for which the red packet is valid, in seconds. */
    duration: number;
    /** Indicates if the red packet should be split randomly. */
    ifSpiltRandom: boolean;
    /** The public key used for claim signature. */
    publicKeyForClaimSignature: web3.PublicKey;
    /** An optional message to include with the red packet. */
    message: string;
    /** An optional display name of the author. */
    authorDisplayName: string;
}

export interface CreateWithSplTokenContext extends CreateWithNativeTokenContext {
    tokenMint: web3.PublicKey;
    tokenProgram: web3.PublicKey;
    tokenAccount: web3.PublicKey;
}

export interface ClaimNativeTokenContext {
    signedMessage: string;
    message?: string;
    publicKey?: string;
    accountId: web3.PublicKey;
}

export interface ClaimSplTokenContext extends ClaimNativeTokenContext {
    tokenAddress: string;
    chainId: number;
    account: string;
}

interface RefundNativeTokenContext {
    accountId: web3.PublicKey;
}

export interface RefundSplTokenContext extends RefundNativeTokenContext {
    tokenMint: web3.PublicKey;
    tokenProgram: web3.PublicKey;
    tokenAccount: web3.PublicKey;
}
