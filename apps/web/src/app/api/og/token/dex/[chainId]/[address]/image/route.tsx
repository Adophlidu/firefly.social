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
    chainId: z.coerce.number().optional(),
    address: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (_request: NextRequest, context?: NextRequestContext) => {
    const { chainId, address } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!chainId || !address) return createProxyImageResponse(getDefaultOgImageUrl());

    const token = await searchToken({ chain_id: chainId, address });
    if (!token) return createProxyImageResponse(getDefaultOgImageUrl());

    return createTokenOpenGraphImageResponse({ token, chainId });
});
