import urlcat from 'urlcat';

import type { ExploreSwitchType } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function setExploreSwitchConfig(switchType: ExploreSwitchType, status: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/explore/switch/set');
    const response = await fireflySessionHolder.fetch<Response<unknown>>(url, {
        method: 'POST',
        body: JSON.stringify({
            list: [
                {
                    platform: 'explore',
                    explore_type: switchType,
                    state: status,
                },
            ],
        }),
    });
    return resolveFireflyResponseData(response);
}
