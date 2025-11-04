import urlcat from 'urlcat';
import { type Hex } from 'viem';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getMessageToSignForBindWallet(address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/messageToSign', {
        address,
    });
    const response = await fireflySessionHolder.fetch<Response<{ message: Hex }>>(url);

    const { message } = resolveFireflyResponseData(response);
    if (!message) throw new Error('Failed to get message to sign');

    return message;
}
