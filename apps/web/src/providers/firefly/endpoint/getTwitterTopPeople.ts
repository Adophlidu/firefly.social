import type { PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Locale } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { RootdataPeopleResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTwitterTopPeople(indicator?: PageIndicator, locale?: Locale) {
    const page = indicator?.id ? Number.parseInt(indicator.id, 10) : 1;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/recommend/x', {
        page,
        page_size: 20,
        rank_type: 'heat',
        language: locale === Locale.en || !locale ? 'en' : 'cn',
    });
    const response = await fetchJson<RootdataPeopleResponse>(url);
    return resolveFireflyResponseData(response);
}
