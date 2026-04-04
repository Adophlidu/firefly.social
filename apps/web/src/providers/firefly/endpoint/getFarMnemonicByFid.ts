import urlcat from 'urlcat';

import { FireflyFidNotRegisteredError } from '@/constants/error.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';

export async function getFarMnemonicByFid(fid: string) {
    try {
        const response = await fireflySessionHolder.fetchWithSession<Response<string[]>>(
            urlcat(location.origin, '/api/firefly/farcaster-mnemonic'),
            {
                method: 'POST',
                body: JSON.stringify({ fid }),
            },
        );
        return resolveFireflyResponseData(response);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Your account has not registered this fid on Firefly')) {
            throw new FireflyFidNotRegisteredError();
        }
        throw error;
    }
}
