import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { parseUrl } from '@dimensiondev/utils';
import { isValidDomainEthereum } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { removeSharerParam } from '@/helpers/sharerUrl.js';
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
    if (envs.external.NEXT_PUBLIC_OPENGRAPH !== STATUS.Enabled) return null;
    if (post?.quoteOn) return null;
    const normalizedUrl = removeSharerParam(url);
    if (!normalizedUrl || !isValidPostLink(normalizedUrl)) return null;

    const response = await fetchJson<ResponseJson<LinkDigested>>(
        urlcat(FIREFLY_WORKER_HOST, '/oembed', {
            link: normalizedUrl,
        }),
    );
    return response.success ? response.data : null;
}
