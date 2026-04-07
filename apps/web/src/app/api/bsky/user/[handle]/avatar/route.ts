import { type NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';

export const runtime = 'edge';

const ParamsSchema = z.object({ handle: z.string() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { handle: idOrHandle } = await getParamsWithZodSchema(ParamsSchema, context);
    const profile = await getBskyProfileById(idOrHandle);
    return createRedirectResponse(profile.pfp);
});
