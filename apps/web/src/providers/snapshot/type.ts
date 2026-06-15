import type { SnapshotChoice, SnapshotProposal } from '@dimensiondev/workers-snapshot';
import type { Address } from 'viem';

import type { FireflyDisplayInfo } from '@/providers/types/Firefly.js';

// Snapshot API shapes are owned by the snapshot worker; re-export them so app-side
// consumers keep importing from this module.
export type {
    SnapshotChoice,
    SnapshotProposal,
    SnapshotStrategy,
    SnapshotUser,
    SnapshotVote,
    SnapshotVotes,
} from '@dimensiondev/workers-snapshot';

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
