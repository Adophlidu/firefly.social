import { compose, NotFoundError } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterProfileByOG } from '@/providers/twitter/getTwitterProfileByOG.js';
import { type NextRequestContext } from '@/types/utility.js';

export const runtime = 'edge';

const ParamsSchema = z.object({ username: z.string() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { username } = await getParamsWithZodSchema(ParamsSchema, context);

    const profile = await getTwitterProfileByOG(username);
    if (!profile) throw new NotFoundError();

    return createRedirectResponse(profile.pfp);
});
