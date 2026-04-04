'use client';

import FireflyMonochromeIcon from '@dimensiondev/assets/firefly-monochrome.svg';
import { Trans } from '@lingui/react/macro';
import { skipToken, useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import { SUPPORTED_FETCH_POST_PUBLISH_INFO_SOURCES } from '@/constants/computed.js';
import { STALE_TIMES } from '@/constants/query.js';
import { isSendFromFirefly } from '@/helpers/isSendFromFirefly.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { getPostPublishPlatformInfo } from '@/services/getPostPublishPlatformInfo.js';

interface Props {
    post: Post;
}

export const PostPublishPlatform = memo<Props>(function PostPublishPlatform({ post }) {
    const enabled = SUPPORTED_FETCH_POST_PUBLISH_INFO_SOURCES.includes(post.source) && !post.sendFrom;
    const { data } = useQuery({
        queryKey: ['post-publish-platform-info', post.source, post.postId],
        staleTime: STALE_TIMES.INFINITY,
        retry: false,
        enabled,
        queryFn: !enabled ? skipToken : () => getPostPublishPlatformInfo(post),
    });

    const platformName = useMemo(() => {
        if (enabled) return data?.name;
        if (!post.sendFrom) return;

        const { displayName, id } = post.sendFrom;
        if (!!id && id === post.author.profileId) return;

        return isSendFromFirefly(post) ? 'Firefly' : displayName;
    }, [data?.name, enabled, post]);

    const publishedByFirefly = platformName?.toLowerCase() === 'firefly';

    return platformName ? (
        <Trans>
            Posted via{' '}
            {publishedByFirefly ? (
                <FireflyMonochromeIcon fontSize={15} width={15} height={15} className="mb-1 inline" />
            ) : null}{' '}
            <span className="capitalize">{platformName}</span>
        </Trans>
    ) : null;
});
