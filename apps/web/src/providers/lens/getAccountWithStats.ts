import {
    type Account,
    AccountFragment,
    type AccountRequest,
    type AccountStats,
    type AccountStatsRequest,
    graphql,
} from '@lens-protocol/client';

import { LENS_PRO_GROUP_ID } from '@/constants/lens.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

async function getAccountWithStats(
    accountRequest: AccountRequest,
    accountStatsRequest: AccountStatsRequest,
): Promise<Profile> {
    const result = await getLensClient().urql.query<
        {
            account: Account;
            accountStats: AccountStats;
            proGroupId: string;
        },
        {
            accountRequest: AccountRequest;
            accountStatsRequest: AccountStatsRequest;
            proGroupId: string;
        }
    >(
        graphql(
            `
                query FullAccount(
                    $accountRequest: AccountRequest!
                    $accountStatsRequest: AccountStatsRequest!
                    $proGroupId: String!
                ) {
                    account(request: $accountRequest) {
                        ...Account
                        hasSubscribed: isMemberOf(request: { group: $proGroupId })
                    }
                    accountStats(request: $accountStatsRequest) {
                        graphFollowStats {
                            followers
                            following
                        }
                    }
                }
            `,
            [AccountFragment],
        ),
        {
            accountRequest,
            accountStatsRequest,
            proGroupId: LENS_PRO_GROUP_ID,
        },
    );
    if (result.error) {
        throw result.error;
    }
    if (!result.data?.account) {
        throw new Error('Account not found');
    }

    const { account, accountStats } = result.data;

    return {
        ...formatLensProfileV3(account),
        followerCount: accountStats?.graphFollowStats.followers ?? 0,
        followingCount: accountStats?.graphFollowStats.following ?? 0,
    };
}

export const getAccountWithStatsById = (profileId: string) =>
    getAccountWithStats(
        {
            address: safeEvmAddress(profileId),
        },
        {
            account: safeEvmAddress(profileId),
        },
    );

export const getAccountWithStatsByHandle = (handle: string) =>
    getAccountWithStats(
        {
            username: { localName: handle },
        },
        {
            username: { localName: handle },
        },
    );
