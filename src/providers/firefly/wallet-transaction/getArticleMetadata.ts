import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type NFTMintingResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getArticleMetadata(articleId: string, hash: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/add/metadata');
    const response = await fireflySessionHolder.fetch<NFTMintingResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            originalId: articleId,
            hash,
        }),
    });

    return resolveFireflyResponseData(response);
}
