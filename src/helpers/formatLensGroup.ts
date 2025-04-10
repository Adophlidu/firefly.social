import type { Group, PostGroupInfo } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { formatLensImageUrl } from '@/helpers/formatImageUrl.js';
import { formatLensFeed } from '@/helpers/formatLensFeed.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

export function formatLensGroup(group: Group): ProfileGroup {
    return {
        source: Source.Lens,
        id: group.address,
        name: group.metadata?.name || '',
        description: group.metadata?.description || '',
        imageUrl: formatLensImageUrl(group.metadata?.icon || ''),
        timestamp: group.timestamp,
        ownerProfileId: group.owner,
        canJoin: !group.operations || group.operations.canJoin.__typename === 'GroupOperationValidationPassed',
        canLeave: !group.operations || group.operations.canLeave.__typename === 'GroupOperationValidationPassed',
        isMember: group.operations?.isMember,
        feed: group.feed ? formatLensFeed(group.feed) : undefined,
    };
}

export function formatLensPostGroup(postGroup: PostGroupInfo): ProfileGroup {
    return {
        source: Source.Lens,
        id: postGroup.address,
        name: postGroup.metadata?.name || '',
        description: postGroup.metadata?.description || '',
        imageUrl: formatLensImageUrl(postGroup.metadata?.icon || ''),
        timestamp: 0,
        ownerProfileId: undefined,
        canJoin: true,
        canLeave: true,
        isMember: false,
        feed: undefined,
    };
}
