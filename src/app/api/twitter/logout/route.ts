import { compose } from '@dimensiondev/utils';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

export const POST = compose(withTwitterRequestErrorHandler, withRequestErrorHandler({ throwError: true }), async () => {
    return createSuccessResponseJson(null, {
        headers: {
            'Set-Cookie': `twitterToken=; path=/; Max-Age=-1; SameSite=Lax; Secure;`,
        },
    });
});
