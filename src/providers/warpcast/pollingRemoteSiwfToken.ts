import urlcat from 'urlcat';

import { WARPCAST_CLIENT_URL_V1 } from '@/constants/index.js';
import { retry } from '@/helpers/retry.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';

interface RemoteSiwfResponse {
    result: {
        request: {
            token: string;
            expiration: number;
            message: string;
            source: unknown;
            signature?: string;
        };
    };
}

export function pollingRemoteSiwfToken(token: string, signal?: AbortSignal) {
    const query = async () => {
        const siwf = await farcasterSessionHolder.fetch<RemoteSiwfResponse>(
            urlcat(WARPCAST_CLIENT_URL_V1, '/remote-siwf', {
                token,
            }),
        );
        if (!siwf.result.request.signature) throw new Error('No signature found');
        return siwf.result.request.signature;
    };

    return retry(query, {
        times: 60,
        interval: 1000,
        signal,
    });
}
