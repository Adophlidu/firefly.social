import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';

const ParamsSchema = z.object({ handle: z.string() });

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { handle: idOrHandle } = await getParamsWithZodSchema(ParamsSchema, context);
    const profile = await getBskyProfileById(idOrHandle);
    return createRedirectResponse(profile.pfp);
});

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params: Promise.resolve(params) });
}
