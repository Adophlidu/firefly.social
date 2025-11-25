import type { Address, Hash, Hex } from 'viem';

export interface OrbResponse<T> {
    status: 'SUCCESS' | 'ERROR';
    data: T;
    msg?: string;
}

export interface SignInResponseData {
    qrCode: string;
    secret: string;
    deepLink: string;
}

export interface PollSignInResponseData {
    processed: boolean;
    source: string;
    user_id: string;
    handle: string;
    idToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}

interface OrbPollOption {
    myVote: boolean;
    option: string;
    optionKey: number;
    pageInfo: { next: null; prev: null };
    voteCount: number;
    votePercentage: number | null;
    voters: unknown[];
}

export interface OrbPoll {
    allowMultipleAnswers: boolean;
    endTimestamp: number;
    isActive: boolean;
    totalVotes: number;
    options: OrbPollOption[];
}

interface VoteTransaction {
    RPC: string;
    amount: string;
    chainId: number;
    data: Hex;
    gasLimit: number;
    gasPerPubdata: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    nonce: number;
    paymaster: Address;
    paymasterInput: Hex;
    to: Address;
}

export interface VoteResult {
    type: 'TRANSACTIONS';
    transactions: VoteTransaction[];
}

export interface CreatePollResult {
    type: 'HASH';
    hash: Hash;
}

export type PollResponse = OrbResponse<OrbPoll>;

export type VoteResultResponse = OrbResponse<VoteResult>;

export type SignInResponse = OrbResponse<SignInResponseData>;

export type PollSignInResponse = OrbResponse<PollSignInResponseData>;

export type CreatePollResponse = OrbResponse<CreatePollResult>;

export type ExploreClubsResponse = OrbResponse<{
    clubs: Array<{
        type: string;
        id: string;
        metadata?: {
            name?: string;
            handle?: string;
            address?: string;
            ownedBy?: string;
            description?: string;
            picture?: string;
            cover?: string;
        };
        stats?: {
            totalMembers?: number;
            timeCreated?: number;
        };
    }>;
    pageInfo?: {
        total?: number;
        hasMore?: boolean;
        next?: string | null;
        prev?: string | null;
    };
}>;
