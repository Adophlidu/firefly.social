import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import { isSameUrl } from '@dimensiondev/utils';
import { uniqWith } from 'lodash-es';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { addSharerParam, getSharerParam, removeSharerParam } from '@/helpers/sharerUrl.js';
import type { EVM } from '@/providers/nftscan/types.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { BetPortfolioItem, NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';
import type { Snap } from '@/types/snap.js';
import type { ResponseJson } from '@/types/utility.js';

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

export type GetClassifyPostLinksResponse = ResponseJson<
    Array<{
        url: string;
        result: ClassifyPostLinkResult | null;
    }>
>;

export async function getClassifyPostLinks(urls: string[]) {
    const normalizedUrls = urls.map(removeSharerParam);
    const response = await fetchJson<GetClassifyPostLinksResponse>(
        urlcat(FIREFLY_WORKER_HOST, `/og`, {
            urls: normalizedUrls.join(','),
        }),
    );
    if (!response.success) return [];

    const resultMap = new Map(response.data.filter((x) => x.result).map((x) => [x.url, x.result])) as Map<
        string,
        ClassifyPostLinkResult
    >;

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
