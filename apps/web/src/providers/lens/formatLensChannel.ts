import { Source } from '@dimensiondev/enums';
import type { Group, LoggedInGroupOperations, PostGroupInfo } from '@lens-protocol/client';

import { formatLensImageUrl } from '@/helpers/formatImageUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

function formatOperations(operations?: LoggedInGroupOperations) {
    return {
        blocked: operations?.isBanned,
        isMember: operations?.isMember,
        canJoin: !operations || operations.canJoin.__typename === 'GroupOperationValidationPassed',
        canLeave: !operations || operations.canLeave.__typename === 'GroupOperationValidationPassed',
    };
}

export function formatLensChannelFromGroup(group: Group): Channel {
    const feed = group.feed;

    return {
        source: Source.Lens,
        id: group.address,
        name: group.metadata?.name || '',
        description: group.metadata?.description || '',
        imageUrl: formatLensImageUrl(group.metadata?.icon || ''),
        url: '',
        parentUrl: '',
        followerCount: 0,
        mutualFollowerCount: 0,
        timestamp: group.timestamp,
        lead: undefined,
        ...formatOperations(group.operations || undefined),
        unavailable:
            !feed || (!!feed.operations && feed.operations.canPost.__typename !== 'FeedOperationValidationPassed'),
        feedId: feed?.address,
        ownerId: group.owner,
        __original__: group,
        __lazy__: true, // need to lazy load followers count and owner
    };
}

export function formatLensChannelFromPostGroup(group: PostGroupInfo): Channel {
    return {
        source: Source.Lens,
        id: group.address,
        name: group.metadata?.name || '',
        description: group.metadata?.description || '',
        imageUrl: formatLensImageUrl(group.metadata?.icon || ''),
        url: '',
        parentUrl: '',
        followerCount: 0,
        mutualFollowerCount: 0,
        timestamp: 0,
        lead: undefined,
        blocked: false,
        isMember: false,
        canJoin: true,
        unavailable: false,
        feedId: undefined,
        ownerId: undefined,
        __original__: group,
        __lazy__: true, // need to lazy load followers count and owner
    };
}
