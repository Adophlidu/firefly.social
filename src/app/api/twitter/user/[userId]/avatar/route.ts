import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { KeyType } from '@/constants/enum.js';
import { MalformedError } from '@/constants/error.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterProfileByOG } from '@/providers/twitter/getTwitterProfileByOG.js';
import { NitterAPIProvider } from '@/providers/twitter/Nitter.js';
import { nitterSocialMediaProvider } from '@/providers/twitter/NitterSocialMedia.js';
import type { NextRequestContext } from '@/types/utility.js';

const getTwitterAvatarById = memoizeWithRedis(
    async (twitterId: string) => {
        const { username } = await NitterAPIProvider.convertUserIdToHandle(twitterId);
        if (!username) throw new MalformedError('username not found');
        const profile = await getTwitterProfileByOG(username);
        if (profile?.pfp) return profile.pfp;
        const { pfp } = await nitterSocialMediaProvider.getProfileByHandle(username);
        return pfp;
    },
    {
        key: KeyType.GetTwitterAvatarById,
    },
);

type Handler = (request: NextRequest, context?: NextRequestContext<{ userId: string }>) => Promise<Response>;

export const GET = compose<Handler>(withRequestErrorHandler(), async (request, context) => {
    const twitterId = (await context?.params)?.userId;
    if (!twitterId) throw new MalformedError('userId not found');
    const pfp = await getTwitterAvatarById(twitterId);
    return createRedirectResponse(pfp);
});
