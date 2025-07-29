import type { NextRequest } from 'next/server.js';

import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

export const POST = compose<(request: NextRequest) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        return createSuccessResponseJson(null, {
            headers: {
                'Set-Cookie': `twitterToken=; path=/; Max-Age=-1; SameSite=Lax; Secure;}`,
            },
        });
    },
);
