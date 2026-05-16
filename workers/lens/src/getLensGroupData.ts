import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { fetchJsonNoCache } from '@dimensiondev/workers-shared/helpers/fetchJsonNoCache.js';

import type { LensGroupData } from '@/lens/src/types.js';

const LENS_API_URL = 'https://api.lens.xyz/graphql';

interface LensGroupResponse {
    owner?: string;
}

interface LensGroupStatsResponse {
    totalMembers?: number;
}

interface GroupQueryResult {
    data?: {
        group?: LensGroupResponse;
        groupStats?: LensGroupStatsResponse;
    };
    errors?: Array<{ message: string }>;
}

const GROUP_QUERY = `
    query GetGroupData($groupRequest: GroupRequest!, $groupStatsRequest: GroupStatsRequest!) {
        group(request: $groupRequest) {
            owner
        }
        groupStats(request: $groupStatsRequest) {
            totalMembers
        }
    }
`;

async function fetchGroupData(groupAddress: string): Promise<LensGroupData | null> {
    try {
        const response = await fetchJsonNoCache<GroupQueryResult>(LENS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: GROUP_QUERY,
                variables: {
                    groupRequest: {
                        group: groupAddress,
                    },
                    groupStatsRequest: {
                        group: groupAddress,
                    },
                },
            }),
        });

        if (response.errors?.length) {
            console.error(`[fetchGroupData] Lens API errors for ${groupAddress}:`, response.errors);
            return null;
        }

        const group = response.data?.group;
        const stats = response.data?.groupStats;

        return {
            address: groupAddress.toLowerCase(),
            ownerId: group?.owner?.toLowerCase(),
            memberCount: stats?.totalMembers ?? 0,
        };
    } catch (error) {
        console.error(`[fetchGroupData] Failed to fetch group ${groupAddress}:`, error);
        return null;
    }
}

export async function getLensGroupsData(groupAddresses: string[]): Promise<LensGroupData[]> {
    if (groupAddresses.length === 0) return [];

    const results = await Promise.allSettled(groupAddresses.map((address) => fetchGroupData(address)));

    return compact(results.map((result) => (result.status === 'fulfilled' ? result.value : null)));
}
