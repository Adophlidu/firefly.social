import type { SnapshotState } from '@dimensiondev/enums';
import type { Address } from 'viem';

import type { FireflyDisplayInfo } from '@/providers/types/Firefly.js';

export type SnapshotChoice = number[] | { [key: string]: number } | number | string;

export interface SnapshotProposal {
    title: string;
    id: string;
    author: string;
    body: string;
    created: number;
    start: number;
    end: number;
    link: string;
    snapshot: number;
    state: SnapshotState;
    symbol: string;
    votes: number;
    type: string;
    quorum: number;
    choices: string[];
    scores: number[];
    scores_by_strategy: number[][];
    scores_total: number;
    scores_updated: number;
    plugins: Record<string, unknown>;
    network: string;
    strategies: SnapshotStrategy[];
    privacy?: string;
    currentUserChoice?: SnapshotChoice;
    space: {
        id: string;
        name: string;
    };
}

export interface SnapshotVote {
    ipfs: string;
    voter: string;
    choice: SnapshotChoice;
    vp: number;
    vp_by_strategy: number[];
    reason: string;
    created: number;
    voterDetail?: SnapshotUser;
    proposal: {
        choices: string[];
        symbol: string;
        id: string;
        type: string;
    };
}

interface SnapshotUser {
    about: string;
    avatar: string;
    created: number;
    id: string;
    name: string;
}

export interface SnapshotVotes {
    data: {
        votes: SnapshotVote[];
    };
}

export interface SnapshotStrategy {
    name: string;
    network: string;
    params: {
        graphs?: {
            [key: string]: string;
        };
        symbol: string;
        strategies?: Array<{
            name: string;
            params: {
                symbol: string;
                address: string;
                decimals: number;
            };
            network: number;
        }>;
        args?: string[];
        address?: string;
        decimals?: number;
        methodABI?: {
            name: string;
            type: string;
            inputs: Array<{
                name: string;
                type: string;
                internalType: string;
            }>;
            outputs: Array<{
                name: string;
                type: string;
                internalType: string;
            }>;
            stateMutability: string;
        };
    };
}

export const voteTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'uint32' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export const voteStringTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'string' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export const vote2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'uint32' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export const voteArray2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'uint32[]' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export const voteString2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'string' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export const voteArrayTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'uint32[]' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' },
    ],
};

export interface SnapshotActivity {
    proposal_id: string;
    proposal?: SnapshotProposal;
    author: {
        /** Wallet address */
        id: Address;
        handle: string;
        avatar: string;
        isFollowing: boolean;
        isMuted: boolean;
    };
    isLiked: boolean;
    likeCount: number;
    owner: string;
    displayInfo: FireflyDisplayInfo;
    type: 'vote';
    id: string;
    timestamp: number;
    choice: SnapshotChoice;
    hash: string;
    related_urls: string[];
    hasBookmarked: boolean;
    fallback_content: {
        title: string;
        body: string;
    };
}
