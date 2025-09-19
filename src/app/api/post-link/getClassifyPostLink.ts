import urlcat from 'urlcat';

import { KeyType, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { TWEET_SPACE_REGEX } from '@/constants/regexp.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import { getPostIframeContent } from '@/providers/og/readers/getPostIframeContent.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { getCollectionFromUrl } from '@/services/getCollectionFromUrl.js';
import { getNFTFromUrl } from '@/services/getNFTFromUrl.js';
import { getSnapshotByLink } from '@/services/getSnapshotByLink.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

const IGNORE_HOSTS = [/^.+\.firefly\.social$/, 'localhost:3000', 'x.com'];

function isValidPostLink(url: string, enableFilter = false) {
    const parsed = parseUrl(url);
    if (!parsed) return false;

    // such as ens domains
    if (isValidDomainEthereum(url)) return false;

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

export interface GetClassifyPostLinkOnActionResult {
    oembed?: LinkDigested;
    frame?: Frame;
    html?: string;
    articleId?: string;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    nft?: NFTDetail;
    collection?: EVM.Collection;
    quote?: Post;
}

export async function getClassifyPostLink(url: string) {
    return attemptUntil<GetClassifyPostLinkOnActionResult | null>(
        [
            async () => {
                const quote = await OpenGraphProcessor.digestPostUrl(url);
                return quote ? { quote } : null;
            },
            async () => {
                const spaceId = url.match(TWEET_SPACE_REGEX)?.[3];
                if (!spaceId) return null;
                return { spaceId };
            },
            async () => {
                const snapshot = await getSnapshotByLink(url);
                if (!snapshot) return null;
                return { snapshot };
            },
            async () => {
                const articleId = await getArticleIdFromUrl(url);
                if (!articleId) return null;
                return { articleId };
            },
            async () => {
                const nft = await getNFTFromUrl(url);
                return nft ? { nft } : null;
            },
            async () => {
                const collection = await getCollectionFromUrl(url);
                return collection ? { collection } : null;
            },
            async () => {
                const html = getPostIframeContent(null, url);
                return html ? { html } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_FRAME !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url, true)) return null;
                const response = await fetchJson<ResponseJson<LinkDigestedResponse>>(
                    urlcat(FIREFLY_WORKER_HOST, '/frame', {
                        link: url,
                    }),
                );
                if (!response.success) return null;
                return response.data.frame ? { frame: response.data.frame } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_OPENGRAPH !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url)) return null;
                const oembed = await OpenGraphProcessor.digestDocumentUrl(url);
                return oembed ? { oembed } : null;
            },
        ],
        null,
        (x) => !x,
    );
}

export const getClassifyPostLinkWithRedis = memoizeWithRedis(getClassifyPostLink, {
    key: KeyType.GetClassifyPostLinkWithRedis,
    resolver: (url) => url,
});
