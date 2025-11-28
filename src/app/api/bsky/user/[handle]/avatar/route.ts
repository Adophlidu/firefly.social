import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { NextRequestContext } from '@/types/utility.js';

const ParamsSchema = z.object({ handle: z.string() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { handle } = await getParamsWithZodSchema(ParamsSchema, context);
    const profile = await bskySocialMediaProvider.getProfileByIdOrHandle(handle);
    return createRedirectResponse(profile.pfp);
});
