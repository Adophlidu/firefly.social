import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface GameCountry {
    bg_color: string;
    country_code: string;
    country_logo: string;
    country_logo_v1: string;
    country_name: string;
    influence_score: number;
    is_eliminate: 0 | 1;
    line_color: string;
    pm_country_names: string[];
    score_percent: number;
    text_color: string;
}

export async function getGameCountries(locale?: Locale) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/countries', {
        locale,
        include_eliminated: 'true',
    });
    const response = await fireflySessionHolder.fetchWithoutSession<Response<{ countries: GameCountry[] }>>(url);
    return resolveFireflyResponseData(response).countries;
}
