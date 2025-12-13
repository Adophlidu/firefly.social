import urlcat from 'urlcat';

import { X3_PRO_AVATAR_URL, X3_PRO_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveX3ProResponse } from '@/helpers/resolveX3ProResponse.js';
import { formatX3Id } from '@/providers/x3pro/formatX3Id.js';
import type { TokenResult } from '@/providers/x3pro/types.js';

export async function getTokenByAddress(address: string) {
    const url = urlcat(X3_PRO_HOST, '/x3pro/scraper/post/getTokenByAddress', { address });
    const res = await fetchJson<TokenResult>(url);
    const token = resolveX3ProResponse(res);
    token.mentionUsers.forEach((user) => {
        user.avatar = `${X3_PRO_AVATAR_URL}/${user.avatar}`;
        user.twitterId = formatX3Id(user.id);
    });

    return token;
}
