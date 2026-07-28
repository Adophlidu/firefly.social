import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PerpsTokenCategory {
    name: string;
    category_name: string;
}

export async function getPerpsTokens() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/perps/token');
    const response = await fireflySessionHolder.fetch<Response<PerpsTokenCategory[]>>(url);
    return resolveFireflyResponseData(response);
}
