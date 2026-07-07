import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { searchToken } from '@/providers/firefly/worker/searchToken.js';
import { createTokenOpenGraphImageResponse } from '@/services/createTokenOpenGraphImageResponse.js';

const ParamsSchema = z.object({
    id: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (_request: NextRequest, context?: NextRequestContext) => {
    const { id } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id) return createProxyImageResponse(getDefaultOgImageUrl());

    const token = await searchToken({ coingecko_id: id });
    if (!token) return createProxyImageResponse(getDefaultOgImageUrl());

    return createTokenOpenGraphImageResponse({ token, chainId: token.chainId });
});
