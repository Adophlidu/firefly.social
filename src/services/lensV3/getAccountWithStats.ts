import { gql } from '@apollo/client';
import {
    type Account,
    AccountFragment,
    type AccountRequest,
    type AccountStats,
    type AccountStatsRequest,
    evmAddress,
} from '@lens-protocol/client';

import { lensApolloClient } from '@/configs/lensApolloClient.js';
import { formatLensProfileV3 } from '@/helpers/formatLensProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

async function getAccountWithStats(
    accountRequest: AccountRequest,
    accountStatsRequest: AccountStatsRequest,
): Promise<Profile> {
    const result = await lensApolloClient.query<
        {
            account: Account;
            accountStats: AccountStats;
        },
        {
            accountRequest: AccountRequest;
            accountStatsRequest: AccountStatsRequest;
        }
    >({
        query: gql`
            query FullAccount($accountRequest: AccountRequest!, $accountStatsRequest: AccountStatsRequest!) {
                account(request: $accountRequest) {
                    ...Account
                }
                accountStats(request: $accountStatsRequest) {
                    graphFollowStats {
                        followers
                        following
                    }
                }
            }
            ${AccountFragment}
        `,
        variables: {
            accountRequest,
            accountStatsRequest,
        },
    });

    if (result.errors?.length) {
        throw result.errors[0];
    }
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
            address: evmAddress(profileId),
        },
        {
            account: evmAddress(profileId),
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
