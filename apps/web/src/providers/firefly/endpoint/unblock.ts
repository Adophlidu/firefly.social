import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockFields, BlockUserResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function unblock(field: BlockFields, profileId: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/unmute');
    const response = await fireflySessionHolder.fetch<BlockUserResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            [field]: profileId,
        }),
    });
    if (response) return true;
    throw new Error('Failed to mute user');
}
