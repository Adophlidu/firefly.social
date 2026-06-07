import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { parseUrl } from '@dimensiondev/utils';
import { isValidDomainEthereum } from '@dimensiondev/web3/utils';
import type { LinkDigested } from '@dimensiondev/workers-oembed';

import { removeSharerParam } from '@/helpers/sharerUrl.js';
import { oembedWorker } from '@/providers/firefly/worker/clients.js';
import type { Post } from '@/providers/types/SocialMedia.js';

const IGNORE_HOSTS = [/^.+\.mask\.social$/, 'localhost:3000', 'x.com'];

function isValidPostLink(url: string, enableFilter = false) {
    const parsed = parseUrl(url);
    if (!parsed) return false;

    if (isValidDomainEthereum(url)) return false;

    // The ipfs link can sometimes be domain/pathname?fileName=xxx.jpg.
    if (/\.\w{1,6}$/i.test(parsed.pathname)) return false;

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

    const res = await oembedWorker.oembed.$get({ query: { link: normalizedUrl } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as LinkDigested) : null;
}
