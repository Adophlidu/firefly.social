import { envs } from '@dimensiondev/envs/web';
import { compose, parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { decryptAes256Edge } from '@/helpers/edgeCrypto.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { EncryptedAccountInfoResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export const runtime = 'edge';

const HeadersSchema = z.object({
    authorization: z.string().min(1, 'Unauthorized'),
});

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
    const { authorization: token } = getHeadersWithZodSchema(request, HeadersSchema);

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/farcaster-account-info');
    const response = await fetchJson<EncryptedAccountInfoResponse>(
        url,
        {
            headers: {
                Authorization: token,
            },
        },
        { noStrictOK: true },
    );
    if (!response.data || response.error) {
        const notFoundMessage = 'Farcaster account not found for this user';
        if (response.error?.[0] === notFoundMessage) return createSuccessResponseJson([]);
        return createErrorResponseJson(response.error?.[0] ?? 'Failed to get farcaster account info.', { status: 400 });
    }
    const encrypted = response.data.data;
    const decrypted = await decryptAes256Edge(
        encrypted,
        envs.internal.SESSION_CIPHER_KEY,
        envs.internal.SESSION_CIPHER_IV,
    );
    const data = AccountInfoScheme.parse(parseJson(decrypted));
    return createSuccessResponseJson(data);
});
