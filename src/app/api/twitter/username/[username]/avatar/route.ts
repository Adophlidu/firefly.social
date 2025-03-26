import { MalformedError, NotFoundError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterProfileByOG } from '@/services/getTwitterProfileByOG.js';

export const GET = compose(withRequestErrorHandler(), async (request, context) => {
    const username = (await context?.params)?.username;
    if (!username) throw new MalformedError('username not found');
    const profile = await getTwitterProfileByOG(username);
    if (!profile) throw new NotFoundError();
    return createRedirectResponse(profile.pfp);
});
