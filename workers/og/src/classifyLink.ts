import { digestDocumentUrl as digestFrameDocumentUrl } from '@dimensiondev/workers-frame/digestDocumentUrl.js';
import type { Frame } from '@dimensiondev/workers-frame/types.js';
import { detectCollection } from '@dimensiondev/workers-metadata/nft/detectCollection.js';
import { getNftDetail } from '@dimensiondev/workers-metadata/nft/getNftDetail.js';
import type { NFTDetail } from '@dimensiondev/workers-metadata/nft/types.js';
import type { BetPortfolioItem, BetsEventDataForUI } from '@dimensiondev/workers-metadata/prediction/types.js';
import { digestDocumentUrl as digestOembedDocumentUrl } from '@dimensiondev/workers-oembed/digestDocumentUrl.js';
import type { LinkDigested } from '@dimensiondev/workers-oembed/types.js';
import { ONE_MONTH, SIX_HOURS } from '@dimensiondev/workers-shared/constants/duration.js';
import { attemptUntil } from '@dimensiondev/workers-shared/helpers/attemptUntil.js';
import { resolveNFTDataFromUrl } from '@dimensiondev/workers-shared/helpers/resolveNFTDataFromUrl.js';
import { withCache } from '@dimensiondev/workers-shared/middlewares/withCache.js';
import type { Article } from '@dimensiondev/workers-shared/types/article.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';
import type { EVM } from '@dimensiondev/workers-shared/types/nftscan.js';
import { digestSnapUrl } from '@dimensiondev/workers-snap/digestSnapUrl.js';
import type { Snap } from '@dimensiondev/workers-snap/types.js';
import { getSnapshotFromUrl } from '@dimensiondev/workers-snapshot/getSnapshotFromUrl.js';
import type { SnapshotProposal } from '@dimensiondev/workers-snapshot/types.js';
import type { Context } from 'hono';

import { getArticleById } from '@/og/src/getArticleById.js';
import { getArticleIdFromUrl } from '@/og/src/getArticleIdFromUrl.js';
import { getEmbedUrl } from '@/og/src/getEmbedUrl.js';
import { getPostFromUrl } from '@/og/src/getPostFromUrl.js';
import { getPostIframeContent } from '@/og/src/getPostIframeContent.js';
import { getPredictionFromUrl } from '@/og/src/getPredictionFromUrl.js';
import { EVM_ADDRESS, TWEET_SPACE_REGEX } from '@/og/src/regexp.js';

export interface ClassifiedLinkResult {
    oembed?: LinkDigested;
    frame?: Frame;
    snap?: Snap;
    html?: string;
    article?: Article;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    nft?: NFTDetail;
    collection?: EVM.Collection;
    quote?: FireflyPost;
    prediction_profile?: BetPortfolioItem;
    prediction_event?: BetsEventDataForUI;
}

const VERSION = 5;

function getCacheKey(link: string, slot: string, slotVersion: number) {
    return `og:${VERSION}:${slot}:${slotVersion}:${encodeURIComponent(link)}`;
}

/**
 * Classify a link and return the appropriate result
 * Tries different link types in order: post, snapshot, article, nft, collection, frame, oembed
 */
export async function classifyLink(
    url: string,
    c: Context<{ Bindings: { OG_CACHE: KVNamespace; TCO_CACHE: KVNamespace } }>,
    cacheOnly = false,
): Promise<ClassifiedLinkResult | null> {
    function createCachedAttempt(
        slot: string,
        slotVersion: number,
        fn: () => Promise<ClassifiedLinkResult | null>,
        ttl?: number,
    ) {
        return async () => {
            const cacheKey = getCacheKey(url, slot, slotVersion);
            if (cacheOnly) {
                const cached = await c.env.OG_CACHE.get<ClassifiedLinkResult>(cacheKey, 'json');
                return cached;
            }
            const result = await withCache({
                context: c,
                getKey: () => cacheKey,
                getCache: () => c.env.OG_CACHE,
                ttl: ttl ?? ONE_MONTH,
                compute: fn,
                isValidCache: (result) => result !== null,
            });
            return result;
        };
    }
    return attemptUntil<ClassifiedLinkResult | null>(
        [
            createCachedAttempt('quote', 0, async () => {
                const quote = await getPostFromUrl(url, c);
                if (!quote) return null;

                console.log(`[classifyLink] Found post: ${quote.postId}, source: ${quote.source}`);

                return { quote };
            }),
            createCachedAttempt('spaceId', 0, async () => {
                const spaceId = url.match(TWEET_SPACE_REGEX)?.[3];
                if (!spaceId) return null;
                return { spaceId };
            }),
            createCachedAttempt(
                'prediction',
                0,
                async () => {
                    const result = await getPredictionFromUrl(url, c);
                    if (!result) return null;

                    if (result.prediction_profile) {
                        console.log(`[classifyLink] Found prediction profile: ${result.prediction_profile.platform}`);
                    } else if (result.prediction_event) {
                        console.log(`[classifyLink] Found prediction event: ${result.prediction_event.platform}`);
                    }

                    return result;
                },
                SIX_HOURS,
            ),
            createCachedAttempt('snapshot', 0, async () => {
                const snapshot = await getSnapshotFromUrl(url, c);
                if (!snapshot) return null;

                console.log(`[classifyLink] Found snapshot: ${snapshot.id}, title: ${snapshot.title}`);

                return { snapshot };
            }),
            createCachedAttempt('article', 0, async () => {
                const articleId = await getArticleIdFromUrl(url, c);
                if (!articleId) return null;

                const article = await getArticleById(articleId, c);
                if (!article) return null;

                console.log(`[classifyLink] Found article: ${article.id}, title: ${article.title}`);

                return { article };
            }),
            createCachedAttempt('nft', 0, async () => {
                const nftParams = resolveNFTDataFromUrl(url);
                if (!nftParams) return null;

                const nft = await getNftDetail(nftParams.chainId, nftParams.address, nftParams.tokenId, c);
                if (!nft) return null;

                console.log(`[classifyLink] Found NFT: ${nft.contract_address}, name: ${nft.name}`);

                return { nft };
            }),
            createCachedAttempt('collection', 0, async () => {
                const [address] = url.match(EVM_ADDRESS) ?? [];
                if (!address) return null;

                const collection = await detectCollection(address, c);
                if (!collection) return null;

                console.log(
                    `[classifyLink] Found collection: ${collection.contract_address}, name: ${collection.name}`,
                );

                return { collection };
            }),
            createCachedAttempt('html', 0, async () => {
                const embedUrl = await getEmbedUrl(url, c);
                const referer = c.req.header('Referer') || c.req.header('Origin');
                const html = getPostIframeContent(embedUrl, url, referer);
                if (!html) return null;

                return { html };
            }),
            createCachedAttempt('snap', 0, async () => {
                const snapResult = await digestSnapUrl(url, c);
                if (!snapResult?.snap) return null;

                console.log(`[classifyLink] Found snap: ${url}`);
                return { snap: snapResult.snap };
            }),
            createCachedAttempt('frame', 0, async () => {
                const frameResult = await digestFrameDocumentUrl(url, c);
                if (!frameResult?.frame) return null;

                return { frame: frameResult.frame };
            }),
            createCachedAttempt('oembed', 1, async () => {
                const oembed = await digestOembedDocumentUrl(url, c);
                if (!oembed) return null;

                return { oembed };
            }),
        ],
        null,
        (x) => !x,
    );
}
