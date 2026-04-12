import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockFields, BlockUserResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function block(field: BlockFields, value: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/mute');
    const response = await fireflySessionHolder.fetch<BlockUserResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            [field]: value,
        }),
    });
    if (response) return true;
    throw new Error('Failed to block user');
}
