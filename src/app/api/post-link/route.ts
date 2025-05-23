import { compact } from 'lodash-es';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { KeyType, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { TWEET_SPACE_REGEX } from '@/constants/regexp.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { parseJSON } from '@/helpers/parseJSON.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveTCOLink } from '@/helpers/resolveTCOLink.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { FrameProcessor } from '@/providers/frame/Processor.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import { getPostIFrame } from '@/providers/og/readers/iframe.js';
import { Snapshot } from '@/providers/snapshot/index.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { getCollectionFromUrl } from '@/services/getCollectionFromUrl.js';
import { getNFTFromUrl } from '@/services/getNFTFromUrl.js';
import { getTruthSocialPostFromUrl } from '@/services/getTruthSocialPostFromUrl.js';
import { settings } from '@/settings/index.js';
import type { FireflyBlinkParserBlinkResponse, FireflyBlinkParserBlinkResponseData } from '@/types/blink.js';
import type { Frame } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';

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
                const spaceId = url.match(TWEET_SPACE_REGEX)?.[3];
                if (!spaceId) return null;
                return { spaceId };
            },
            async () => {
                const realUrl = (await resolveTCOLink(url)) ?? url;
                if (!realUrl) return null;
                const snapshot = await Snapshot.getSnapshotByLink(realUrl);
                if (!snapshot) return null;
                return { snapshot };
            },
            async () => {
                const realUrl = (await resolveTCOLink(url)) ?? url;
                if (!realUrl) return null;
                const articleId = await getArticleIdFromUrl(realUrl);
                if (!articleId) return null;
                return { articleId };
            },
            // nft
            async () => {
                const nft = await getNFTFromUrl(url);
                return nft ? { nft } : null;
            },
            // nft collection
            async () => {
                const collection = await getCollectionFromUrl(url);
                return collection ? { collection } : null;
            },
            async () => {
                // try iframe first. As we don't have to call other services if matched
                const html = getPostIFrame(null, url);
                return html ? { html } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_FRAME !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url, true)) return null;
                const frame = (await FrameProcessor.digestDocumentUrl(url))?.frame;
                return frame ? { frame } : null;
            },
            async () => {
                if (env.external.NEXT_PUBLIC_BLINK !== STATUS.Enabled) return null;
                if (!url || !isValidPostLink(url)) return null;
                const actionUrl = (await resolveTCOLink(url)) ?? url;
                const response = await fetchJSON<FireflyBlinkParserBlinkResponse>(
                    urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/blinks/parse'),
                    {
                        method: 'POST',
                        body: JSON.stringify({ url: actionUrl }),
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
    ignoreCacheWhen: (result) => !result, // not caching `null` cases
    resolver: (url) => url,
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
        const result = await getClassifyPostLinkWithRedis(url).catch(() => null);
        return createSuccessResponseJSON(result);
    }
    const urls = request.nextUrl.searchParams.get('cache-urls')?.split(',');
    if (urls) {
        const cacheResults = await Promise.allSettled(
            urls.map(async (url) => ({ url, result: await getClassifyPostLinkWithRedis.cache.get(url) })),
        );
        const results = compact(
            cacheResults
                .map((x) =>
                    x.status === 'fulfilled'
                        ? { result: parseJSON<GetClassifyPostLinkOnActionResult>(x.value.result), url: x.value.url }
                        : null,
                )
                .filter((x) => x?.result),
        );
        return createSuccessResponseJSON(results);
    }
    return createSuccessResponseJSON(null);
});

export const DELETE = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
        await getClassifyPostLinkWithRedis.cache.delete(url);
        return createSuccessResponseJSON(true);
    }
    return createSuccessResponseJSON(false);
});
