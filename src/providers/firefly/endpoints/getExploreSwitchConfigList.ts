import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetExploreSwitchConfigResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getExploreSwitchConfigList(deviceId?: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/explore/switch/get', {
        device_id: deviceId,
    });
    const response = await fireflySessionHolder.fetch<GetExploreSwitchConfigResponse>(url);
    return resolveFireflyResponseData(response);
}
