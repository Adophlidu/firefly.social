import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type ArticlePlatform } from '@/providers/types/Article.js';
import { type CollectArticleResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function freeCollectArticle(articleId: string, address: string, type: ArticlePlatform) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/article');
    const response = await fireflySessionHolder.fetch<CollectArticleResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            articleType: type,
            walletAddress: address,
            originalId: articleId,
        }),
    });

    const data = resolveFireflyResponseData(response);
    if (!data.status) throw new Error(data.errormessage || 'Failed to collect article');

    return data;
}
