import urlcat from 'urlcat';

import { KeyType, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { TWEET_SPACE_REGEX } from '@/constants/regexp.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isBlinkBlocklist } from '@/helpers/isBlinkBlocklist.js';
import { isBlinkWhitelist } from '@/helpers/isBlinkWhitelist.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import { getPostIframeContent } from '@/providers/og/readers/getPostIframeContent.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { digestBskyPostLink } from '@/services/digestBskyPostLink.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { getCollectionFromUrl } from '@/services/getCollectionFromUrl.js';
import { getNFTFromUrl } from '@/services/getNFTFromUrl.js';
import { getSnapshotByLink } from '@/services/getSnapshotByLink.js';
import { getTruthSocialPostFromUrl } from '@/services/getTruthSocialPostFromUrl.js';
import { settings } from '@/settings/index.js';
import type { FireflyBlinkParserBlinkResponse, FireflyBlinkParserBlinkResponseData } from '@/types/blink.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import type { ResponseJSON } from '@/types/index.js';

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
    action?: FireflyBlinkParserBlinkResponseData;
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
                const truthSocialPost = await getTruthSocialPostFromUrl(url);
                return truthSocialPost ? { quote: truthSocialPost } : null;
            },
            async () => {
                const bskyPost = await digestBskyPostLink(url);
                return bskyPost ? { quote: bskyPost } : null;
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
                const response = await fetchJSON<ResponseJSON<LinkDigestedResponse>>(
                    urlcat(FIREFLY_WORKER_HOST, '/frame', {
                        link: url,
                    }),
                );
                if (!response.success) return null;
                return response.data.frame ? { frame: response.data.frame } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_BLINK !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url) || isBlinkBlocklist(url)) return null;
                if (!(await isBlinkWhitelist(url))) return null;
                const response = await fetchJSON<FireflyBlinkParserBlinkResponse>(
                    urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/blinks/parse'),
                    {
                        method: 'POST',
                        body: JSON.stringify({ url }),
                    },
                );
                if (!response.data) return null;
                const action = resolveFireflyResponseData(response);
                return action ? { action } : null;
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
