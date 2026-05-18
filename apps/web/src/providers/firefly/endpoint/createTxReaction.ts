import type { TxReactionType } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { EmptyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function createTxReaction(
    reaction_type: TxReactionType,
    platform_id: string,
    reaction_id: string,
    reaction_owner_id: string,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/reaction/create');
    await fireflySessionHolder.fetch<EmptyResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform_id,
            reaction_type,
            reaction_id,
            reaction_owner_id,
        }),
    });
    return true;
}
