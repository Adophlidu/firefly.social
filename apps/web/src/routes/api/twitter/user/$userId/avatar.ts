import { KeyType } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { MalformedRequestError } from '@/constants/error.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterHandleById } from '@/providers/firefly/worker/getTwitterHandleById.js';
import { nitterSocialMediaProvider } from '@/providers/nitter/NitterSocialMedia.js';
import { getTwitterProfileByOG } from '@/providers/twitter/getTwitterProfileByOG.js';

const getTwitterAvatarById = memoizeWithRedis(
    async (twitterId: string) => {
        const username = await getTwitterHandleById(twitterId);
        if (!username) throw new MalformedRequestError('username not found');
        const profile = await getTwitterProfileByOG(username);
        if (profile?.pfp) return profile.pfp;
        const { pfp } = await nitterSocialMediaProvider.getProfileByHandle(username);
        return pfp;
    },
    {
        key: KeyType.GetTwitterAvatarById,
    },
);

const ParamsSchema = z.object({ userId: z.string() });

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { userId: twitterId } = await getParamsWithZodSchema(ParamsSchema, context);
    const pfp = await getTwitterAvatarById(twitterId);
    return createRedirectResponse(pfp);
});

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params } as never);
}
