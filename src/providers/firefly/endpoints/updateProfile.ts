import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FireflyProfileUpdateParams } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function updateProfile(params: FireflyProfileUpdateParams) {
    await fireflySessionHolder.fetchWithSession(urlcat(settings.FIREFLY_ROOT_URL, `/v3/user/profile`), {
        method: 'PUT',
        body: JSON.stringify(params),
    });
}
