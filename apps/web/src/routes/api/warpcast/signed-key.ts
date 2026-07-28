import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { waitForSignedKeyRequest } from '@/providers/farcaster/waitForSignedKeyRequest.js';

const Schema = z.object({
    token: z.string(),
});

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { token } = Schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const result = await waitForSignedKeyRequest(request.signal)(token);
    return createSuccessResponseJson(result);
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
