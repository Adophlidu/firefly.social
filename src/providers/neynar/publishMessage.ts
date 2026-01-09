import { parseJson } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { encodeMessageData, type WithMessageData } from '@/providers/neynar/encodeMessageData.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function publishMessage<T>(withMessageData: WithMessageData) {
    const { messageJson } = await encodeMessageData(withMessageData);

    const data = typeof messageJson === 'string' ? parseJson(messageJson) : messageJson;
    if (!data || typeof data !== 'object') throw new Error('Invalid Farcaster message payload.');

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/message/send');
    const response = await fireflySessionHolder.fetchWithSession<Response<T>>(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    return resolveFireflyResponseData(response);
}
