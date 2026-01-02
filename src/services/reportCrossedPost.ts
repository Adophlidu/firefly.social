import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { logger } from '@/libs/Logger.js';
import { reportPost } from '@/providers/firefly/report/reportPost.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { ReportCrossPostResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import type { CompositePost } from '@/types/compose.js';

interface Report {
    // client uuid for distinguishing logs
    relation_id: string;
    // in seconds
    post_time: number;
    post_id: string;
    // profile id in such platforms as Lens, Farcaster, etc.
    platform_id: string;
    ua_type: 'web' | 'ios' | 'android' | 'schedule:web' | 'schedule:ios' | 'schedule:android';
    // platform name
    platform: string;
}

const resolvePlatform = createLookupTableResolver<SocialSource, FireflyPlatform>(
    {
        [Source.Farcaster]: FireflyPlatform.Farcaster,
        [Source.Lens]: FireflyPlatform.Lens,
        [Source.Twitter]: FireflyPlatform.Twitter,
        [Source.Bsky]: FireflyPlatform.Bsky,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

function resolvePlatformType(post: CompositePost) {
    return compact(['text', post.videos.length ? 'video' : null, post.images.length ? 'image' : null]);
}

async function report(post: CompositePost) {
    // a post shared across multiple platforms will have the same relation ID
    const relationId = crypto.randomUUID();

    const reports = compact(
        SORTED_SOCIAL_SOURCES.map<Report | null>((x) => {
            const postId = post.postId[x];
            if (!postId) return null;

            const profileId = getCurrentProfileFromStorage(x)?.profileId;
            if (!profileId) return null;

            return {
                ua_type: 'web',
                relation_id: relationId,
                // TODO: post time of the original post
                post_time: dayjs(Date.now()).unix(),
                post_id: postId,
                // TODO: profile id of the author
                platform_id: profileId,
                platform: resolvePlatform(x),
            };
        }),
    );
    if (!reports.length) return;

    const allSettled = await Promise.allSettled(
        reports.map(async (x) => {
            if (!x) return null;
            await reportPost(
                x.platform as FireflyPlatform,
                x.platform_id,
                resolvePlatformType(post),
                x.post_id,
                x.relation_id,
                {
                    content: Array.isArray(post.chars)
                        ? post.chars.map((char) => (typeof char === 'string' ? char : char.content)).join('')
                        : post.chars,
                },
            );
            return fireflySessionHolder.fetch<ReportCrossPostResponse>(
                // cspell: disable-next-line
                urlcat(settings.FIREFLY_ROOT_URL, '/api/logpush'),
                {
                    method: 'POST',
                    body: JSON.stringify(x),
                },
                {
                    withSession: true,
                },
            );
        }),
    );

    allSettled.forEach((x, i) => {
        const source = SORTED_SOCIAL_SOURCES[i];

        // ignore null report
        if (x.status === 'fulfilled' && x.value === null) return;

        if (x.status === 'rejected') {
            logger.error(`[report]: occurs error when report ${source} post: ${post.postId[source]}`, x.reason);
        } else if (x.value?.code !== 0) {
            logger.error(`[report]: occurs error when report ${source} post: ${post.postId[source]}`, x.value?.error);
        } else {
            logger.info(`[report]: report ${source} post: ${post.postId[source]} successfully.`);
        }
    });
}

export async function reportCrossedPost(post: CompositePost) {
    requestIdleCallback(() => report(post));
}
