import { last, omit } from 'lodash-es';
import type { Address } from 'viem';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SnapshotState } from '@/constants/enum.js';
import { SNAPSHOT_GRAPHQL_URL, SNAPSHOT_RELAY_URL, SNAPSHOT_SCORES_URL, SNAPSHOT_SEQ_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { plus } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { ProposalsQuery, UsersQuery, VotesQuery } from '@/providers/snapshot/query.js';
import {
    type SnapshotChoice,
    type SnapshotProposal,
    type SnapshotStrategy,
    type SnapshotUsers,
    type SnapshotVote,
    type SnapshotVotes,
    vote2Types,
    voteArray2Types,
    voteArrayTypes,
    voteString2Types,
    voteStringTypes,
    voteTypes,
} from '@/providers/snapshot/type.js';
import { getSnapshotByLink } from '@/services/getSnapshotByLink.js';

const NAME = 'snapshot';
const VERSION = '0.1.4';

export class Snapshot {
    static getProposalLink(proposal: SnapshotProposal) {
        return `https://snapshot.box/#/s:${proposal.space.id}/proposal/${proposal.id}`;
    }

    static getProposalState(proposal: SnapshotProposal) {
        if (proposal.state === SnapshotState.Closed) {
            if (proposal.scores_total < proposal.quorum) return SnapshotState.Rejected;
            return proposal.type !== 'basic' || proposal.scores[0] > proposal.scores[1]
                ? SnapshotState.Passed
                : SnapshotState.Rejected;
        }

        return proposal.state;
    }

    static async deserializeSnapshotProposal(snapshotProposal: SnapshotProposal, address: string) {
        const proposal = {
            ...snapshotProposal,
            state: Snapshot.getProposalState(snapshotProposal),
        };
        if (!address) return proposal;

        const votes = await Snapshot.pathQueryVoteResultsByVoter([snapshotProposal.id], address);

        const target = last(votes.data);
        if (!target) return proposal;

        return {
            ...proposal,
            currentUserChoice: target.choice,
        };
    }

    static async getSnapshotByLink(link: string, address: Address): Promise<SnapshotProposal | undefined> {
        const proposal = await getSnapshotByLink(link);
        if (!proposal) return;
        return Snapshot.deserializeSnapshotProposal(proposal, address);
    }

    static async getProposals(ids: string[], address?: string) {
        const response = await fetchJson<{ data: { proposals: SnapshotProposal[] } }>(SNAPSHOT_GRAPHQL_URL, {
            method: 'POST',
            body: JSON.stringify({
                ...ProposalsQuery,
                variables: {
                    id_in: ids,
                    first: 20,
                },
            }),
        });

        if (!response.data.proposals) return [];

        if (!address) return response.data.proposals;

        const votes = await Snapshot.pathQueryVoteResultsByVoter(ids, address);

        const proposals = response.data.proposals.map((proposal) => {
            const target = votes.data.find((vote) => vote.proposal.id === proposal.id);
            return {
                ...proposal,
                state: Snapshot.getProposalState(proposal),
                currentUserChoice: target?.choice,
            };
        });

        return proposals;
    }

    static async getVotesById(id: string, indicator?: PageIndicator) {
        const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
            method: 'POST',
            body: JSON.stringify({
                ...VotesQuery,
                variables: {
                    id,
                    first: 20,
                    orderBy: 'created',
                    orderDirection: 'desc',
                    skip: Number(indicator?.id ?? 0),
                },
            }),
        });

        const votes = votesResponse.data.votes;

        const usersResponse = await fetchJson<SnapshotUsers>(SNAPSHOT_GRAPHQL_URL, {
            method: 'POST',
            body: JSON.stringify({
                ...UsersQuery,
                variables: {
                    addresses: votes.map((vote) => vote.voter),
                },
            }),
        });

        const results = votes.map<SnapshotVote>((vote) => {
            const user = usersResponse.data.users.find((user) => isSameEthereumAddress(user.id, vote.voter));
            return {
                ...vote,
                voterDetail: user,
            };
        });

        return createPageable(
            results,
            createIndicator(indicator),
            results.length ? createNextIndicator(indicator, plus(indicator?.id ?? 0, 20).toString()) : null,
        );
    }

    static async pathQueryVoteResultsByVoter(ids: string[], voter: string, indicator?: PageIndicator) {
        const votesResponse = await fetchJson<SnapshotVotes>(SNAPSHOT_GRAPHQL_URL, {
            method: 'POST',
            body: JSON.stringify({
                ...VotesQuery,
                variables: {
                    ids,
                    voter,
                    first: 20,
                    skip: Number(indicator?.id ?? 0),
                },
            }),
        });

        const votes = votesResponse.data.votes;

        return createPageable(
            votes,
            createIndicator(indicator),
            createNextIndicator(indicator, plus(indicator?.id ?? 0, 20).toString()),
        );
    }

    static async getVotePower(
        address: string,
        network: string,
        strategies: SnapshotStrategy[],
        snapshot: number | 'latest',
        space: string,
        delegation: boolean,
    ) {
        const response = await fetchJson<{ result: { vp: number; vp_by_strategy: number[]; vp_state: string } }>(
            SNAPSHOT_SCORES_URL,
            {
                method: 'POST',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'get_vp',
                    params: {
                        address,
                        network,
                        strategies,
                        snapshot,
                        space,
                        delegation,
                    },
                }),
            },
        );

        return response.result;
    }

    static async vote(payload: {
        from: string;
        space: string;
        proposal: string;
        type: string;
        choice: SnapshotChoice;
        privacy?: string;
        reason?: string;
        app?: string;
        metadata?: string;
    }) {
        const isShutter = payload.privacy === 'shutter';

        const isType2 = payload.proposal.startsWith('0x');

        let types = isType2 ? vote2Types : voteTypes;
        if (['approval', 'ranked-choice'].includes(payload.type)) types = isType2 ? voteArray2Types : voteArrayTypes;
        if (!isShutter && ['quadratic', 'weighted'].includes(payload.type)) {
            types = isType2 ? voteString2Types : voteStringTypes;
            payload.choice = JSON.stringify(payload.choice);
        }

        if (isShutter) types = isType2 ? voteString2Types : voteStringTypes;

        const message = omit(payload, 'privacy', 'type');

        const messageData = {
            timestamp: Number.parseInt((Date.now() / 1e3).toFixed(), 10),
            ...message,
            choice:
                isShutter && ['quadratic', 'weighted'].includes(payload.type)
                    ? JSON.stringify(payload.choice)
                    : payload.choice,
            reason: message.reason ?? '',
            app: message.app ?? '',
            metadata: message.metadata ?? '{}',
        };

        const client = await getWalletClientRequired(wagmiConfig);
        const signedTypedData = await client.signTypedData({
            domain: {
                name: NAME,
                version: VERSION,
            },
            types,
            primaryType: 'Vote',
            message: messageData,
        });

        const response = await fetchJson<{ id?: string; ipfs?: string; error_description?: string }>(
            signedTypedData === '0x' ? SNAPSHOT_RELAY_URL : SNAPSHOT_SEQ_URL,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    address: payload.from,
                    sig: signedTypedData,
                    data: {
                        domain: {
                            name: NAME,
                            version: VERSION,
                        },
                        message: messageData,
                        types,
                    },
                }),
            },
        );
        if (!response.ipfs) throw new Error(`Failed to vote. ${response.error_description}`);

        return response.ipfs;
    }
}
