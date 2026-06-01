import urlcat from 'urlcat';

import { RedPacketMetaKey } from '@/constants/rp.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CreateCoverResponse } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';
import type { RedPacketMetadata } from '@/types/rp.js';

export async function createCover(metadata: RedPacketMetadata) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/misc/maskTypedMessage/create');
    const { data } = await fireflySessionHolder.fetch<CreateCoverResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            meta: JSON.stringify({
                [RedPacketMetaKey]: metadata,
            }),
            type: 'text',
            content: '',
        }),
    });
    return data;
}
