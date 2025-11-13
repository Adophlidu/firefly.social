import {
    type Account,
    AccountFragment,
    type AccountRequest,
    graphql,
    type Group,
    GroupFragment,
    type GroupRequest,
    type GroupStatsRequest,
    type GroupStatsResponse,
    GroupStatsResponseFragment,
} from '@lens-protocol/client';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function getGroupWithMemberCount(groupId: string): Promise<Channel> {
    const groupAddress = safeEvmAddress(groupId);
    const result = await lensSessionHolder.sdk.urql.query<
        {
            group: Group;
            groupStats: GroupStatsResponse;
        },
        {
            groupRequest: GroupRequest;
            groupStatsRequest: GroupStatsRequest;
        }
    >(
        graphql(
            `
                query GroupWithStats($groupRequest: GroupRequest!, $groupStatsRequest: GroupStatsRequest!) {
                    group(request: $groupRequest) {
                        ...Group
                    }
                    groupStats(request: $groupStatsRequest) {
                        ...GroupStatsResponse
                    }
                }
            `,
            [GroupFragment, GroupStatsResponseFragment],
        ),
        {
            groupRequest: {
                group: groupAddress,
            },
            groupStatsRequest: {
                group: groupAddress,
            },
        },
    );
    if (result.error) throw result.error;
    if (!result.data?.group) throw new Error('Group not found');

    const { group, groupStats } = result.data;

    return {
        ...formatLensChannelFromGroup(group),
        followerCount: groupStats?.totalMembers || 0,
    };
}

export async function getGroupWithOwner(groupId: string, groupOwner: string): Promise<Channel> {
    const groupAddress = safeEvmAddress(groupId);
    const result = await lensSessionHolder.sdk.urql.query<
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
    >(
        graphql(
            `
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
            `,
            [GroupFragment, AccountFragment, GroupStatsResponseFragment],
        ),
        {
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
    );
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
