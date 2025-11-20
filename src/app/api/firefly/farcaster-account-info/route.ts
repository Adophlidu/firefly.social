import { compose, parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { EncryptedAccountInfoResponse } from '@/providers/types/Firefly.js';
import { decryptAes256 } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

const AccountInfoScheme = z.array(
    z.object({
        user_name: z.string(),
        avatar: z.string(),
        signer_publickey: z.string(),
        signer_privatekey: z.string(),
        display_name: z.string(),
        bio: z.string(),
        account_id: z.string(),
        fid: z.string(),
        account_raw_id: z.string(),
    }),
);

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const token = request.headers.get('authorization');
    if (!token) return createErrorResponseJson('Unauthorized', { status: 401 });

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/farcaster-account-info');
    const response = await fetchJson<EncryptedAccountInfoResponse>(
        url,
        {
            method: 'GET',
            headers: {
                Authorization: token,
            },
        },
        { noStrictOK: true },
    );
    if (!response.data || response.error) {
        const notFoundMessage = 'Farcaster account not found for this user';
        if (response.error?.[0] === notFoundMessage) {
            return createSuccessResponseJson([]);
        }
        return createErrorResponseJson(response.error?.[0] ?? 'Failed to get farcaster account info.', { status: 400 });
    }
    const encrypted = response.data.data;
    const decrypted = decryptAes256(encrypted, env.internal.SESSION_CIPHER_KEY, env.internal.SESSION_CIPHER_IV);
    const accountInfo = AccountInfoScheme.safeParse(parseJson(decrypted));
    if (!accountInfo.success) {
        return createErrorResponseJson(accountInfo.error.message, { status: 500 });
    }
    return createSuccessResponseJson(accountInfo.data);
});
