import type { FireflyPlatform } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockRelationResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBlockRelation(conditions: Array<{ snsPlatform: FireflyPlatform; snsId: string }>) {
    return fireflySessionHolder.withSession(async (session) => {
        if (!session) return [];
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/muteRelation');
        const response = await fireflySessionHolder.fetch<BlockRelationResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                conditions,
            }),
        });
        return response.data ?? [];
    });
}
