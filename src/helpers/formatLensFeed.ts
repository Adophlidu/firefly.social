import type { Feed, Group, PostFeedInfo } from '@lens-protocol/client';

import { Source } from '@/constants/enum.js';
import { formatLensGroup, formatLensPostGroup } from '@/helpers/formatLensGroup.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export function formatLensFeed(feed: Feed): Channel<Feed> {
    return {
        source: Source.Lens,
        id: feed.address,
        name: feed.metadata?.name || '',
        description: feed.metadata?.description || '',
        imageUrl: '',
        url: '',
        parentUrl: '',
        followerCount: 0,
        mutualFollowerCount: 0,
        timestamp: feed.createdAt,
        unavailable: !!feed.operations && feed.operations.canPost.__typename !== 'FeedOperationValidationPassed',
        __original__: feed,
    };
}

export function formatLensPostFeed(feed: PostFeedInfo, keepGroup = false): Channel | undefined {
    if (!feed.metadata?.name && !keepGroup) return;

    return {
        id: feed.address,
        source: Source.Lens,
        name: feed.metadata?.name || '',
        description: feed.metadata?.description || '',
        group: keepGroup && feed.group ? formatLensPostGroup(feed.group) : undefined,
        __lazy__: true,
    } as unknown as Channel;
}

export function formatChannelFromLensGroup(group: Group): Channel | undefined {
    if (!group.feed) return;

    return {
        ...formatLensFeed(group.feed),
        group: formatLensGroup(group),
    };
}
