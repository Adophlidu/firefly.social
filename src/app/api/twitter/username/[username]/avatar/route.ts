import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError, NotFoundError } from '@/constants/error.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterProfileByOG } from '@/providers/twitter/getTwitterProfileByOG.js';
import type { NextRequestContext } from '@/types/utility.js';

type Handler = (request: NextRequest, context?: NextRequestContext<{ username: string }>) => Promise<Response>;

export const GET = compose<Handler>(withRequestErrorHandler(), async (request, context) => {
    const username = (await context?.params)?.username;
    if (!username) throw new MalformedError('username not found');
    const profile = await getTwitterProfileByOG(username);
    if (!profile) throw new NotFoundError();
    return createRedirectResponse(profile.pfp);
});
