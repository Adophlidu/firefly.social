import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type GetTokenOptions, type Response, type TokenWithMarketData } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSingleCoin(options: GetTokenOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/single_token', options);

    const response = await fireflySessionHolder.fetch<Response<TokenWithMarketData>>(url);
    return resolveFireflyResponseData(response);
}
