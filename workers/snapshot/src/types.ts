import type { SnapshotState } from '@dimensiondev/enums';

export type SnapshotChoice = number[] | { [key: string]: number } | number | string;

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
        avatar?: string;
    };
}

export interface SnapshotUser {
    about: string;
    avatar: string;
    created: number;
    id: string;
    name: string;
}

export interface SnapshotVote {
    ipfs: string;
    voter: string;
    choice: SnapshotChoice;
    vp: number;
    vp_by_strategy: number[];
    reason: string;
    created: number;
    metadata?: string;
    voterDetail?: SnapshotUser;
    proposal: {
        choices: string[];
        symbol: string;
        id: string;
        type: string;
    };
}

export interface SnapshotVotes {
    data: {
        votes: SnapshotVote[];
    };
}

export interface SnapshotUsers {
    data: {
        users: SnapshotUser[];
    };
}
