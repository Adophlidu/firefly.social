import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose, NotFoundError } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterProfileByOG } from '@/providers/twitter/getTwitterProfileByOG.js';

const ParamsSchema = z.object({ username: z.string() });

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { username } = await getParamsWithZodSchema(ParamsSchema, context);

    const profile = await getTwitterProfileByOG(username);
    if (!profile) throw new NotFoundError();

    return createRedirectResponse(profile.pfp);
});

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params: Promise.resolve(params) });
}
