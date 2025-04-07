import { MalformedError, NotFoundError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { convertTwitterIdToHandle } from '@/services/convertTwitterIdToHandle.js';
import { getTwitterProfileByOG } from '@/services/getTwitterProfileByOG.js';

export const GET = compose(withRequestErrorHandler(), async (request, context) => {
    const twitterId = (await context?.params)?.userId;
    if (!twitterId) throw new MalformedError('userId not found');
    const username = await convertTwitterIdToHandle(twitterId);
    if (!username) throw new MalformedError('username not found');
    const profile = await getTwitterProfileByOG(username);
    if (!profile) throw new NotFoundError();
    return createRedirectResponse(profile.pfp);
});
