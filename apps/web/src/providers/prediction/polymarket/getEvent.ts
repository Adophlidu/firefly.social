import { Locale } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolvePolymarketResponse } from '@/providers/prediction/polymarket/resolvePolymarketResponse.js';
import type { PolymarketEventResponse } from '@/providers/prediction/polymarket/type.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

function resolvePolymarketLocale(locale?: Locale) {
    if (!locale) return;

    switch (locale) {
        case Locale.zhHans:
            return 'zh';
        case Locale.zhHant:
            return 'zh-hant';
        case Locale.en:
            return;
        case Locale.es:
            return 'es';
        case Locale.ja:
            return 'ja';
        case Locale.ko:
            return;
        default:
            safeUnreachable(locale);
            return;
    }
}

async function getPolymarketEventBySlug(slug: string, locale?: Locale) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, `/v1/polymarket/event/detail`, {
        slug,
        locale: resolvePolymarketLocale(locale),
    });
    const response = await fetchJson<Response<PolymarketEventResponse>>(url);
    const result = resolveFireflyResponseData(response);
    return resolvePolymarketResponse(result);
}

async function getPolymarketEventById(id: string, locale?: Locale) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, `/v1/polymarket/event/detail`, {
        event_id: id,
        locale: resolvePolymarketLocale(locale),
    });
    const response = await fetchJson<Response<PolymarketEventResponse>>(url);
    const result = resolveFireflyResponseData(response);
    return resolvePolymarketResponse(result);
}

export async function getPolymarketEvent({ id, slug, locale }: { id?: string; slug?: string; locale?: Locale }) {
    if (id) return getPolymarketEventById(id, locale);
    if (slug) return getPolymarketEventBySlug(slug, locale);

    throw new Error('Either id or slug must be provided');
}
