import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { waitForSignedKeyRequest } from '@/providers/farcaster/waitForSignedKeyRequest.js';

export const runtime = 'edge';

const Schema = z.object({
    token: z.string(),
});

export const maxDuration = 300;

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { token } = getSearchParamsWithZodSchema(request, Schema);
    const result = await waitForSignedKeyRequest(request.signal)(token);
    return createSuccessResponseJson(result);
});
