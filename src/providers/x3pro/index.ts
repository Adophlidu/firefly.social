/* cspell:disable */
import { last } from 'lodash-es';
import urlcat from 'urlcat';

import { X3_PRO_AVATAR_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { formatX3Id, formatX3ProPost } from '@/providers/x3pro/helpers.js';
import {
    type KolList,
    type MentionUsersRespone,
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

const HOST = 'https://firefly.r2d2.to';
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
        const url = urlcat(HOST, '/x3pro/scraper/kol/kolPage', { label, orderType, pageNo, pageSize });
        const res = await fetchJson<Response<KolList>>(url);
        return resolveX3ProResponse(res);
    }
    async getTokenByAddress(address: string) {
        const url = urlcat(HOST, '/x3pro/scraper/post/getTokenByAddress', { address });
        const res = await fetchJson<TokenResult>(url);
        const token = resolveX3ProResponse(res);
        token.mentionUsers.forEach((user) => {
            user.avatar = `${X3_PRO_AVATAR_URL}/${user.avatar}`;
            user.twitterId = formatX3Id(user.id);
        });

        return token;
    }
    async getTokenMention(address: string) {
        const url = urlcat(HOST, '/x3pro/external/getMentionByCa', { address });
        const res = await fetchJson<MentionUsersRespone>(url);
        const mention = resolveX3ProResponse(res);
        mention.mentionUsers.forEach((user) => {
            if (!user.avatar.match(/^https?:\/\//)) {
                user.avatar = `${X3_PRO_AVATAR_URL}/${user.avatar}`;
            }
            user.twitterId = formatX3Id(user.id);
        });
        return mention;
    }
    async searchPosts(address: string, indicator?: PageIndicator, orderType: PostOrderType = PostOrderType.DESC) {
        const [lastId, lastTime] = indicator?.id ? indicator.id.split(',') : [];
        const url = urlcat(HOST, '/x3pro/scraper/post/postFlow', {
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
}

export const X3ProProvider = new X3Pro();
