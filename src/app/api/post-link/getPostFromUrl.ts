import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getPostFromUrl(postUrl: string): Promise<Post | null> {
    const response = await fetchJson<ResponseJson<Post | null>>(
        urlcat(FIREFLY_WORKER_HOST, '/post-url', { url: postUrl }),
        {
            headers: fireflySessionHolder.session?.token
                ? {
                      Authorization: `Bearer ${fireflySessionHolder.session.token}`,
                      ['X-FIREFLY-ID']: fireflySessionHolder.session?.profileId ?? '',
                      ['X-FARCASTER-ID']: farcasterSessionHolder.session?.profileId ?? '',
                      ['X-LENS-ID']: lensSessionHolder.session?.profileId ?? '',
                      ['X-BSKY-ID']: lensSessionHolder.session?.profileId ?? '',
                      ['X-TWITTER-ID']: twitterSessionHolder.session?.profileId ?? '',
                  }
                : undefined,
        },
    );
    const post = resolveResponseData(response);
    return post;
}
