import { SiteCookies } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const SearchParamsSchema = z.object({
    root_class: z.string(),
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { root_class: rootClass } = SearchParamsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    return createSuccessResponseJson(null, {
        headers: {
            'Set-Cookie': `${SiteCookies.FireflyRootClass}=${rootClass}; path=/; Max-Age=315360000; SameSite=Lax; Secure;`,
        },
    });
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
