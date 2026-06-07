import { isSameUrl } from '@dimensiondev/utils';
import type { ClassifiedLinkResult } from '@dimensiondev/workers-og';
import { uniqWith } from 'lodash-es';

import { addSharerParam, getSharerParam, removeSharerParam } from '@/helpers/sharerUrl.js';
import { ogWorker } from '@/providers/firefly/worker/clients.js';
import type { EVM } from '@/providers/nftscan/types.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { BetPortfolioItem, NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';
import type { Snap } from '@/types/snap.js';

export interface ClassifyPostLinkResult {
    oembed?: LinkDigested;
    frame?: Frame;
    snap?: Snap;
    html?: string;
    article?: Article;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    nft?: NFTDetail;
    collection?: EVM.Collection;
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
