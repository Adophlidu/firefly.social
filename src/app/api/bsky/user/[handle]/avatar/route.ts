import { MalformedError } from '@/constants/error.js';
import { compose } from '@/helpers/compose.js';
import { createRedirectResponse } from '@/helpers/createRedirectResponse.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';

export const GET = compose(withRequestErrorHandler(), async (request, context) => {
    const handle = (await context?.params)?.handle;
    if (!handle) throw new MalformedError('handle not found');
    const profile = await BskySocialMediaProvider.getProfileByIdOrHandle(handle);
    return createRedirectResponse(profile.pfp);
});
