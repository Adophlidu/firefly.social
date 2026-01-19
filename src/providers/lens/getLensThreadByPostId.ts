import { PageSize } from '@lens-protocol/client';
import { fetchPosts } from '@lens-protocol/client/actions';
import urlcat from 'urlcat';

import { EMPTY_LIST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type ResponseJson } from '@/types/utility.js';

export async function getLensThreadByPostId(postId: string) {
    const response = await fetchJson<ResponseJson<string[]>>(urlcat('/api/thread', { id: postId }));
    if (!response.success) return EMPTY_LIST;

    const posts = await ensureLensResult(
        fetchPosts(getLensClient(), {
            pageSize: PageSize.Fifty,
            filter: {
                metadata: {
                    tags: { all: [postId, ...response.data] }, // TODO
                },
            },
        }),
    );

    return Promise.all(posts.items.map(formatLensPostV3));
}
