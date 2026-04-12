import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { GenerateFarcasterSignatureResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function generateFarcasterSignatures(key: Hex, deadline: number, jwt: string, signal?: AbortSignal) {
    const response = await fetchJson<GenerateFarcasterSignatureResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/v1/farcaster/generate-signatures'),
        {
            method: 'POST',
            body: JSON.stringify({ key, deadline }),
            headers: {
                authorization: `Bearer ${jwt}`,
            },
            signal,
        },
    );
    return resolveFireflyResponseData(response);
}
