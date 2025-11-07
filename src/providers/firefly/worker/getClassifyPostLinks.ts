import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import type { SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article } from '@/providers/types/Article.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame } from '@/types/frame.js';
import type { LinkDigested } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

export interface ClassifyPostLinkResult {
    oembed?: LinkDigested;
    frame?: Frame;
    html?: string;
    article?: Article;
    spaceId?: string;
    snapshot?: SnapshotProposal;
    nft?: NFTDetail;
    collection?: EVM.Collection;
    quote?: Post;
}

export type GetClassifyPostLinksResponse = ResponseJson<
    Array<{
        url: string;
        result: ClassifyPostLinkResult;
    }>
>;

export async function getClassifyPostLinks(urls: string[]) {
    const response = await fetchJson<GetClassifyPostLinksResponse>(
        urlcat(FIREFLY_WORKER_HOST, `/og`, {
            urls: urls.join(','),
        }),
    );
    if (!response.success) return [];
    return response.data.filter((x) => x.result);
}
