import { gql } from '@apollo/client';
import {
    type Account,
    AccountFragment,
    type AccountRequest,
    type AccountStats,
    type AccountStatsRequest,
} from '@lens-protocol/client';

import { lensApolloClient } from '@/configs/lensApolloClient.js';
import { LENS_PRO_GROUP_ID } from '@/constants/lens.js';
import { formatLensProfileV3 } from '@/helpers/formatLensProfile.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

async function getAccountWithStats(
    accountRequest: AccountRequest,
    accountStatsRequest: AccountStatsRequest,
): Promise<Profile> {
    const result = await lensApolloClient.query<
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
    >({
        query: gql`
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
            ${AccountFragment}
        `,
        variables: {
            accountRequest,
            accountStatsRequest,
            proGroupId: LENS_PRO_GROUP_ID,
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
