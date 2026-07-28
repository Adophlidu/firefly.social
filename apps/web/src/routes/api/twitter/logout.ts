import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (_request: NextRequest) => {
        return createSuccessResponseJson(null, {
            headers: {
                'Set-Cookie': `twitterToken=; path=/; Max-Age=-1; SameSite=Lax; Secure; HttpOnly;`,
            },
        });
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
