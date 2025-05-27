/* cspell:disable */
import { last } from 'lodash-es';

import { fetchJSON } from '@/helpers/fetchJSON.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { formatX3Id, formatX3ProPost, X3_PRO_AVATAR_HOST } from '@/providers/x3pro/helpers.js';
import {
    type KolList,
    type PostListResponse,
    PostOrderType,
    type Response,
    type TokenResult,
    X3ProKolListLabel,
    type X3ProOrderType,
} from '@/providers/x3pro/types.js';

function resolveX3ProResponse<T>(res: Response<T>) {
    if (res.success) return res.data;
    throw new Error(res.error.message);
}

class X3Pro {
    async getKolList(
        label: X3ProKolListLabel,
        orderType: X3ProOrderType,
        options?: {
            pageNo?: number;
            pageSize?: number;
        },
    ) {
        const { pageNo = 1, pageSize = 20 } = options || {};
        const res = await fetchJSON<Response<KolList>>('/api/x3pro/scraper/kol/kolPage', {
            method: 'POST',
            body: JSON.stringify({ label, orderType, pageNo, pageSize }),
        });
        return resolveX3ProResponse(res);
    }
    async getTokenByAddress(address: string) {
        const res = await fetchJSON<TokenResult>('/api/x3pro/scraper/post/getTokenByAddress', {
            method: 'POST',
            body: JSON.stringify({ address }),
        });
        const token = resolveX3ProResponse(res);
        token.mentionUsers.forEach((user) => {
            user.avatar = `${X3_PRO_AVATAR_HOST}/${user.avatar}`;
            user.twitterId = formatX3Id(user.id);
        });

        return token;
    }
    async searchPosts(address: string, indicator?: PageIndicator, orderType: PostOrderType = PostOrderType.DESC) {
        const [lastId, lastTime] = indicator?.id ? indicator.id.split(',') : [];
        const res = await fetchJSON<PostListResponse>('/api/x3pro/scraper/post/postFlow', {
            method: 'POST',
            body: JSON.stringify({
                address,
                orderType,
                size: 10,
                lastId,
                lastTime: lastTime ? Number(lastTime) : undefined,
                cursor: indicator?.id,
            }),
        });

        const posts = resolveX3ProResponse(res);
        const lastPost = last(posts);
        return createPageable(
            posts.map((x) => formatX3ProPost(x)),
            createIndicator(indicator),
            lastPost ? createNextIndicator(indicator, [lastPost.id, lastPost.createTime].join(',')) : undefined,
        );
    }
}

export const X3ProProvider = new X3Pro();
