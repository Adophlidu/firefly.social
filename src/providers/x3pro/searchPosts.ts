import { last } from 'lodash-es';
import urlcat from 'urlcat';

import { X3_PRO_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveX3ProResponse } from '@/helpers/resolveX3ProResponse.js';
import { formatX3ProPost } from '@/providers/x3pro/formatX3ProPost.js';
import { type PostListResponse, PostOrderType } from '@/providers/x3pro/types.js';

export async function searchPosts(
    address: string,
    indicator?: PageIndicator,
    orderType: PostOrderType = PostOrderType.DESC,
) {
    const [lastId, lastTime] = indicator?.id ? indicator.id.split(',') : [];
    const url = urlcat(X3_PRO_HOST, '/x3pro/scraper/post/postFlow', {
        address,
        orderType,
        size: 10,
        lastId,
        lastTime: lastTime ? Number(lastTime) : undefined,
        cursor: indicator?.id,
    });
    const res = await fetchJson<PostListResponse>(url);

    const posts = resolveX3ProResponse(res);
    const lastPost = last(posts);
    return createPageable(
        posts.map((x) => formatX3ProPost(x)),
        createIndicator(indicator),
        lastPost ? createNextIndicator(indicator, [lastPost.id, lastPost.createTime].join(',')) : undefined,
    );
}
