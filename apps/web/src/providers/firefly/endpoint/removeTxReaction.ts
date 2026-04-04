import urlcat from 'urlcat';

import { type TxReactionType } from '@/constants/enum.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type EmptyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function removeTxReaction(reaction_type: TxReactionType, reaction_ids: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/reaction/remove');
    await fireflySessionHolder.fetch<EmptyResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            reaction_type,
            reaction_ids,
        }),
    });
    return true;
}
