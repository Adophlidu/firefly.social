import { compose } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { type NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { type GetMnemonicPhraseByFidResponse } from '@/providers/types/Firefly.js';
import { decryptAes256 } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

const HeadersSchema = z.object({
    authorization: z.string().min(1, 'Unauthorized'),
});

const BodySchema = z.object({
    fid: z.string().min(1, 'FID is required'),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { authorization: token } = getHeadersWithZodSchema(request, HeadersSchema);
    const { fid } = await getJsonBodyWithZodSchema(request, BodySchema);

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/mnemonic-phrase', {
        fid,
    });
    const response = await fetchJson<GetMnemonicPhraseByFidResponse>(
        url,
        {
            headers: {
                Authorization: token,
            },
        },
        { noStrictOK: true },
    );
    if (!response.data || response.error) {
        const firstError = Array.isArray(response.error) ? first(response.error) : undefined;
        return createErrorResponseJson(firstError ?? 'Failed to get mnemonic phrase.', { status: 400 });
    }
    const encrypted = response.data?.data;

    const decrypted = decryptAes256(encrypted, env.internal.SESSION_CIPHER_KEY, env.internal.SESSION_CIPHER_IV);

    return createSuccessResponseJson(decrypted.split(' '));
});
