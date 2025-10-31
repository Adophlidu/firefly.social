import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getSearchParamsFromRequestWithZodObject } from '@/helpers/getSearchParamsFromRequestWithZodObject.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { url } = getSearchParamsFromRequestWithZodObject(
        request,
        z.object({
            url: z.string(),
        }),
    );
    return createProxyImageResponse(url);
});
