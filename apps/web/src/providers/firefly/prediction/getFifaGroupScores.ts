import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { FifaGroupScoreListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFifaGroupScores(locale?: Locale): Promise<FifaGroupScoreListData> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/groups/score', { locale });
    const response = await fetchJson<Response<FifaGroupScoreListData>>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);

    return {
        groups: Array.isArray(data?.groups) ? data.groups : [],
    };
}
