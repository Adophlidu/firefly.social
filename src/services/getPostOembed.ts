import { parseUrl } from '@firefly/utils';
import urlcat from 'urlcat';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { LinkDigested } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

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

export async function getPostOembed(url: string, post?: Pick<Post, 'quoteOn'>): Promise<LinkDigested | null> {
    if (env.external.NEXT_PUBLIC_OPENGRAPH !== STATUS.Enabled) return null;
    if (post?.quoteOn) return null;
    if (!url || !isValidPostLink(url)) return null;
    const response = await fetchJson<ResponseJson<LinkDigested>>(
        urlcat(FIREFLY_WORKER_HOST, '/oembed', {
            link: url,
        }),
    );
    return response.success ? response.data : null;
}
