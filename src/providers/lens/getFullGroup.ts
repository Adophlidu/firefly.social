import { gql } from '@apollo/client';
import {
    type Account,
    AccountFragment,
    type AccountRequest,
    type Group,
    GroupFragment,
    type GroupRequest,
    type GroupStatsRequest,
    type GroupStatsResponse,
    GroupStatsResponseFragment,
} from '@lens-protocol/client';

import { lensApolloClient } from '@/configs/lensApolloClient.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function getGroupWithMemberCount(groupId: string): Promise<Channel> {
    const groupAddress = safeEvmAddress(groupId);
    const result = await lensApolloClient.query<
        {
            group: Group;
            groupStats: GroupStatsResponse;
        },
        {
            groupRequest: GroupRequest;
            groupStatsRequest: GroupStatsRequest;
        }
    >({
        query: gql`
            query GroupWithStats($groupRequest: GroupRequest!, $groupStatsRequest: GroupStatsRequest!) {
                group(request: $groupRequest) {
                    ...Group
                }
                groupStats(request: $groupStatsRequest) {
                    ...GroupStatsResponse
                }
            }
            ${GroupFragment}
            ${GroupStatsResponseFragment}
        `,
        variables: {
            groupRequest: {
                group: groupAddress,
            },
            groupStatsRequest: {
                group: groupAddress,
            },
        },
    });
    if (result.errors?.length) {
        throw result.errors[0];
    }
    if (result.error) {
        throw result.error;
    }
    if (!result.data?.group) {
        throw new Error('Group not found');
    }

    const { group, groupStats } = result.data;

    return {
        ...formatLensChannelFromGroup(group),
        followerCount: groupStats?.totalMembers || 0,
    };
}

export async function getGroupWithOwner(groupId: string, groupOwner: string): Promise<Channel> {
    const groupAddress = safeEvmAddress(groupId);
    const result = await lensApolloClient.query<
        {
            group: Group;
            groupStats: GroupStatsResponse;
            account: Account;
        },
        {
            groupRequest: GroupRequest;
            groupStatsRequest: GroupStatsRequest;
            accountRequest: AccountRequest;
        }
    >({
        query: gql`
            query FullGroup(
                $groupRequest: GroupRequest!
                $groupStatsRequest: GroupStatsRequest!
                $accountRequest: AccountRequest!
            ) {
                group(request: $groupRequest) {
                    ...Group
                }
                groupStats(request: $groupStatsRequest) {
                    ...GroupStatsResponse
                }
                account(request: $accountRequest) {
                    ...Account
                }
            }
            ${GroupFragment}
            ${GroupStatsResponseFragment}
            ${AccountFragment}
        `,
        variables: {
            groupRequest: {
                group: groupAddress,
            },
            groupStatsRequest: {
                group: groupAddress,
            },
            accountRequest: {
                address: safeEvmAddress(groupOwner),
            },
        },
    });
    if (result.errors?.length) {
        throw result.errors[0];
    }
    if (result.error) {
        throw result.error;
    }
    if (!result.data?.group) {
        throw new Error('Group not found');
    }

    const { group, groupStats, account } = result.data;

    return {
        ...formatLensChannelFromGroup(group),
        followerCount: groupStats?.totalMembers || 0,
        lead: account ? formatLensProfileV3(account) : undefined,
    };
}
