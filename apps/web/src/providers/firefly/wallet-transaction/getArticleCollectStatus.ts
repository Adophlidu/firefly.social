import type { ArticlePlatform } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetCollectStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getArticleCollectStatus(articleId: string, address: string, type: ArticlePlatform) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/mint/status');
    const response = await fireflySessionHolder.fetch<GetCollectStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            articleType: type,
            walletAddress: address,
            originalId: articleId,
        }),
    });

    return resolveFireflyResponseData(response);
}
