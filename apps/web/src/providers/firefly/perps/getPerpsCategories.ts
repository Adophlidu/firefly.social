import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PerpsCategory {
    name: string;
    display_name: string;
}

export async function getPerpsCategories() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/perps/category');
    const response = await fireflySessionHolder.fetch<Response<PerpsCategory[]>>(url);
    return resolveFireflyResponseData(response);
}
