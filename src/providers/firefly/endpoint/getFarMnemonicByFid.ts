import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';

export async function getFarMnemonicByFid(fid: string) {
    const response = await fireflySessionHolder.fetchWithSession<Response<string[]>>(
        urlcat(location.origin, '/api/firefly/farcaster-mnemonic'),
        {
            method: 'POST',
            body: JSON.stringify({ fid }),
        },
    );
    return resolveFireflyResponseData(response);
}
