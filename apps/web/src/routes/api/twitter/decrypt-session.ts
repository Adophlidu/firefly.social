import { envs } from '@dimensiondev/envs/web';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose, parseJson } from '@dimensiondev/utils';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { TwitterMetricsData } from '@/providers/types/Firefly.js';
import { decryptAes256 } from '@/services/crypto.js';

const SearchPageable = z.object({
    encryptKey: z.string(),
    ciphertext: z.string(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { ciphertext, encryptKey } = getSearchParamsWithZodSchema(request, SearchPageable);

    const decrypted = decryptAes256(ciphertext, encryptKey, envs.external.NEXT_PUBLIC_PASSCODE_IV);
    const data = parseJson<TwitterMetricsData>(decrypted);
    if (!data) return createErrorResponseJson('Invalid ciphertext', { status: 400 });

    const payload = await TwitterSessionPayload.recordPayload({
        clientId: data.client_id,
        accessToken: data.access_token,
        accessTokenSecret: data.access_token_secret,
        consumerKey: data.consumer_key,
        consumerSecret: data.consumer_secret,
    });

    return createSuccessResponseJson(await TwitterSessionPayload.concealPayload(payload));
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
