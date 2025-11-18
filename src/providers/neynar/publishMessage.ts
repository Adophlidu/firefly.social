import urlcat from 'urlcat';
import { z } from 'zod';

import { FarcasterInvalidSignerKey } from '@/constants/error.js';
import { NEYNAR_URL } from '@/constants/index.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import { encodeMessageData, type WithMessageData } from '@/providers/neynar/encodeMessageData.js';
import type { Response } from '@/providers/types/Hubble.js';

const ErrorResponseSchema = z.custom<Response<never>>((response) => {
    const error = response as Response<never>;
    return (
        typeof error.code === 'number' &&
        typeof error.name === 'string' &&
        typeof error.errCode === 'string' &&
        typeof error.details === 'string'
    );
});

export async function publishMessage<T>(withMessageData: WithMessageData) {
    const { messageJson } = await encodeMessageData(withMessageData);

    const url = urlcat(NEYNAR_URL, '/v2/farcaster/message');
    const response = await fetchNeynarJson<Response<T>>(url, {
        method: 'POST',
        body: JSON.stringify(messageJson),
    });

    const parsed = ErrorResponseSchema.safeParse(response);

    if (parsed.success) {
        // invalid signer: signer not found for fid
        if (parsed.data.code === 3 && parsed.data.errCode === 'bad_request.validation_failure')
            throw new FarcasterInvalidSignerKey('Invalid signer key.');

        throw new Error(parsed.data.details);
    } else {
        return response as T;
    }
}
