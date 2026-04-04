import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PolymarketEventLocale } from '@/providers/prediction/polymarket/type.js';
import { type PolymarketTranslationData, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    event_id: string;
    language: PolymarketEventLocale;
    title?: string;
    description?: string;
}

export async function translatePolymarketEventData(options: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/event/translate');
    const response = await fireflySessionHolder.fetch<Response<PolymarketTranslationData>>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    return resolveFireflyResponseData(response);
}
