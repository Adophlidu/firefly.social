import { envs } from '@dimensiondev/envs';
import { compose, parseJson } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { type NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { type RegisterFarcasterResponse } from '@/providers/types/Firefly.js';
import { decryptAes256 } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

const HeadersSchema = z.object({
    authorization: z.string().min(1, 'Unauthorized'),
});

const BodySchema = z.object({
    handle: z.string().min(1),
    displayName: z.string().optional(),
    pfp: z.string().optional(),
    bio: z.string().optional(),
});

const SignerDataScheme = z.object({
    accessToken: z.string(),
    accountId: z.string(),
    fid: z.string(),
    signerPrivatekey: z.string(),
    signerPublickey: z.string(),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { authorization: token } = getHeadersWithZodSchema(request, HeadersSchema);
    const { handle, displayName, bio, pfp } = await getJsonBodyWithZodSchema(request, BodySchema);

    // 1. register fid on chain and bind session
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/register-with-condition');
    const response = await fetchJson<RegisterFarcasterResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            conditionType: 'free_register',
            userName: handle,
            displayName,
            bio,
            avatar: pfp,
            isForce: false,
        }),
        headers: {
            Authorization: token,
        },
    });
    const result = resolveFireflyResponseData(response);
    if (result.status !== 'success' || !result.userInfo) {
        const firstError = Array.isArray(result.error) ? first(result.error) : undefined;
        return createErrorResponseJson(firstError ?? result.message ?? 'Failed to register farcaster account.', {
            status: 400,
        });
    }

    // 2. decrypt data
    const decrypted = decryptAes256(result.userInfo, envs.internal.SESSION_CIPHER_KEY, envs.internal.SESSION_CIPHER_IV);

    const data = SignerDataScheme.parse(parseJson(decrypted));
    return createSuccessResponseJson(data);
});
