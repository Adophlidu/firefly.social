import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type DesktopLinkInfoResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getDesktopLinkInfo() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/linkInfo');
    const response = await fireflySessionHolder.fetch<DesktopLinkInfoResponse>(url);
    return resolveFireflyResponseData(response);
}
