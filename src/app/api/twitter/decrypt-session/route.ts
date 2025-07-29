import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { TwitterMetricsData } from '@/providers/types/Firefly.js';
import { decryptMetricsData } from '@/services/encryptMetricsData.js';

const SearchPageable = z.object({
    encryptKey: z.string(),
    ciphertext: z.string(),
});

export async function GET(request: NextRequest) {
    const queryParams = getSearchParamsFromRequestWithZodObject(request, SearchPageable);

    const decrypted = decryptMetricsData(
        queryParams.ciphertext,
        queryParams.encryptKey,
        env.external.NEXT_PUBLIC_PASSCODE_IV,
    );
    const data = JSON.parse(decrypted) as TwitterMetricsData;

    const payload = await TwitterSessionPayload.recordPayload({
        clientId: data.client_id,
        accessToken: data.access_token,
        accessTokenSecret: data.access_token_secret,
        consumerKey: data.consumer_key,
        consumerSecret: data.consumer_secret,
    });

    return createSuccessResponseJson(await TwitterSessionPayload.concealPayload(payload));
}
