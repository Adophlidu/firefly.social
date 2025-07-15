import urlcat from 'urlcat';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { isValidPollFrameUrl } from '@/helpers/resolveEmbedMediaType.js';
import { resolveTcoLink } from '@/helpers/resolveTcoLink.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';
import type { ResponseJSON } from '@/types/index.js';
import type { LinkDigested } from '@/types/og.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';

// We are confident that these hosts will not be used for frame links
const IGNORE_HOSTS = [/^.+\.mask\.social$/, 'localhost:3000', 'x.com'];

function isValidPostLink(url: string, enableFilter = false) {
    const parsed = parseUrl(url);
    if (!parsed) return false;

    // such as ens domains
    if (isValidDomainEthereum(url)) return false;

    // file extension
    // The ipfs link can sometimes be domain/pathname?fileName=xxx.jpg.
    if (/\.\w{1,6}$/i.test(parsed.pathname)) return false;

    // ignore hosts
    if (
        enableFilter &&
        IGNORE_HOSTS.some((pattern) =>
            typeof pattern === 'string' ? pattern === parsed.host : pattern.test(parsed.host),
        )
    ) {
        return false;
    }

    return true;
}

export async function getPostFrame(url: string): Promise<Frame | null> {
    if (env.external.NEXT_PUBLIC_FRAME !== STATUS.Enabled) return null;
    if (!url || !isValidPostLink(url, true)) return null;
    const response = await fetchJSON<ResponseJSON<LinkDigestedResponse>>(
        urlcat(FIREFLY_WORKER_HOST, '/frame', {
            link: url,
        }),
    );
    return response.success ? response.data.frame : null;
}

export const getPostOembed = memoizePromise(
    async function getPostOembed(url: string, post?: Pick<Post, 'quoteOn'>): Promise<LinkDigested | null> {
        if (env.external.NEXT_PUBLIC_OPENGRAPH !== STATUS.Enabled) return null;
        if (!url || !isValidPostLink(url)) return null;
        if (post?.quoteOn) return null;
        const linkDigested = await fetchJSON<ResponseJSON<LinkDigested>>(
            urlcat('/api/oembed', {
                link: (await resolveTcoLink(url)) ?? url,
            }),
        );
        return linkDigested.success ? linkDigested.data : null;
    },
    (url, post) => `${url}${post?.quoteOn?.postId}`,
);

export function getPollIdFromLink(url: string) {
    if (!isValidPollFrameUrl(url)) return;

    const parsed = parseUrl(url);

    return parsed?.pathname.split('/')[2];
}
