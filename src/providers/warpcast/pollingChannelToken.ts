import urlcat from 'urlcat';

import { InvalidResultError } from '@/constants/error.js';
import { FARCASTER_REPLY_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { retry } from '@/helpers/retry.js';

interface ChannelStatusResponse {
    nonce: string;
    acceptAuthAddress: boolean;
    signatureParams: {
        siweUri: string;
        domain: string;
        nonce: string;
    };
    metadata: {
        userAgent: string;
        ip: string;
    };
}

interface ChannelPendingResponse extends ChannelStatusResponse {
    state: 'pending';
}

interface ChannelCompleteResponse extends ChannelStatusResponse {
    state: 'completed';
    message: string;
    signature: string;
    authMethod: 'custody';
    fid: number;
    username: string;
    displayName: string;
    bio: string;
    pfpUrl: string;
    custody: string;
    verifications: string[];
}

export async function pollingChannelToken(token: string, signal?: AbortSignal) {
    const query = async () => {
        const signed = await fetchJSON<ChannelPendingResponse | ChannelCompleteResponse>(
            urlcat(FARCASTER_REPLY_URL, '/v1/channel/status'),
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        if (signed.state === 'pending') throw new InvalidResultError();
        return signed;
    };

    const result = await retry(query, {
        times: Number.POSITIVE_INFINITY,
        signal,
    });
    return result;
}
