import { FARCASTER_REPLY_URL } from '@dimensiondev/constants/static';
import { InvalidResultError, retry } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';

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
    const result = await retry(
        async () => {
            const signed = await fetchJson<ChannelPendingResponse | ChannelCompleteResponse>(
                urlcat(FARCASTER_REPLY_URL, '/v1/channel/status'),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal,
                },
            );
            if (signed.state === 'pending') throw new InvalidResultError();
            return signed;
        },
        {
            times: Number.POSITIVE_INFINITY,
            signal,
        },
    );
    return result;
}
