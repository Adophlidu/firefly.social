import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { VITALIK_ADDRESS } from '@/constants/static.js';
import { formatArticleFromFirefly } from '@/helpers/formatArticleFromFirefly.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isZero } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { ArticlePlatform } from '@/providers/types/Article.js';
import { type DiscoverArticlesResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function discoverArticlesByAddress(
    address: string | string[],
    indicator?: PageIndicator,
    platforms: ArticlePlatform[] = [],
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/articles_v2');
    const limoPlatform = Array.isArray(address)
        ? address.some((x) => isSameEthereumAddress(VITALIK_ADDRESS, x))
        : isSameEthereumAddress(VITALIK_ADDRESS, address);

    const response = await fireflySessionHolder.fetch<DiscoverArticlesResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform:
                platforms.length > 0 && platforms.length < 4
                    ? platforms.join(',')
                    : compact([
                          ArticlePlatform.Paragraph,
                          ArticlePlatform.Mirror,
                          ArticlePlatform.Matters,
                          limoPlatform ? ArticlePlatform.Limo : undefined,
                      ]).join(','),
            walletAddresses: Array.isArray(address) ? address : [address],
            size: 20,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        }),
        //  the data in articles can be very large because it retrieves the details of all articles, so the timeout duration has been extended
        signal: AbortSignal.timeout(5 * 60 * 1000 /* 5 mins */),
    });

    const data = resolveFireflyResponseData(response);

    const articles = data.result.map(formatArticleFromFirefly);

    return createPageable(
        articles,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
