import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
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
    const response = await fetchJson<GetClassifyPostLinksResponse>(
        urlcat(FIREFLY_WORKER_HOST, `/og`, {
            urls: urls.join(','),
        }),
    );
    if (!response.success) return [];
    return response.data.filter((x) => x.result) as Array<{ url: string; result: ClassifyPostLinkResult }>;
}
