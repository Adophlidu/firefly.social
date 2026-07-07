import { isSameUrl } from '@dimensiondev/utils';
import { ogWorker } from '@dimensiondev/workers-client';
import type { ClassifiedLinkResult } from '@dimensiondev/workers-og';
import type { Snap } from '@dimensiondev/workers-snap';
import { uniqWith } from 'lodash-es';

import { addSharerParam, getSharerParam, removeSharerParam } from '@/helpers/sharerUrl.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { BetPortfolioItem } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

/** NFT collection detected from a contract address in a post (OG link classification). */
interface PostLinkCollection {
    contract_address: string;
}

export interface ClassifyPostLinkResult {
    oembed?: LinkDigested;
    frame?: Frame;
    snap?: Snap;
    html?: string;
    article?: Article;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    collection?: PostLinkCollection;
    quote?: Post;
    prediction_event?: BetsEventDataForUI;
    prediction_profile?: BetPortfolioItem;
}

export async function getClassifyPostLinks(urls: string[]) {
    const normalizedUrls = urls.map(removeSharerParam);
    const res = await ogWorker.og.urls.$get({ query: { urls: normalizedUrls.join(',') } });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];

    const resultMap = new Map(
        json.data.filter((x) => x.result !== null).map((x) => [x.url, x.result as unknown as ClassifyPostLinkResult]),
    );

    return uniqWith(
        normalizedUrls.flatMap((normalizedUrl, index) => {
            const result = resultMap.get(normalizedUrl);
            if (!result) return [];

            if (result.oembed?.og) {
                const sid = getSharerParam(urls[index]);
                if (sid) {
                    result.oembed = {
                        ...result.oembed,
                        og: { ...result.oembed.og, url: addSharerParam(result.oembed.og.url, sid) },
                    };
                }
            }

            return [{ url: urls[index], result }];
        }),
        (a, b) => isSameUrl(a.url, b.url),
    );
}

export type { ClassifiedLinkResult };
