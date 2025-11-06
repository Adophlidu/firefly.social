import urlcat from 'urlcat';

import { Locale } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { ProjectResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTopProjects(locale: Locale) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/project/top100', {
        days: 1,
        language: locale === Locale.en ? 'en' : 'cn',
    });
    const response = await fetchJson<ProjectResponse>(url, { method: 'GET' });

    return resolveFireflyResponseData(response);
}
