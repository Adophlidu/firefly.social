import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { LoginFarcasterWithWalletResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function loginFarcasterWithWallet(
    sysAccount: string,
    originalMessage: string,
    signatureMessage: string,
    isForce: boolean,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/login/fid/wallet');
    const body = {
        sysAccount,
        originalMessage,
        signatureMessage,
        isForce,
    };
    let response = await fireflySessionHolder.fetch<LoginFarcasterWithWalletResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify(body),
        },
        {
            noStrictOK: true,
        },
    );
    if (response.code === 232) {
        response = await fireflySessionHolder.fetchWithoutSession<LoginFarcasterWithWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    return resolveFireflyResponseData(response);
}
