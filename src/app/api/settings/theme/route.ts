import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { SiteCookies } from '@/constants/enum.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const SearchParamsSchema = z.object({
    root_class: z.string(),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { root_class: rootClass } = getSearchParamsWithZodSchema(request, SearchParamsSchema);

    return createSuccessResponseJson(null, {
        headers: {
            'Set-Cookie': `${SiteCookies.FireflyRootClass}=${rootClass}; path=/; Max-Age=315360000; SameSite=Lax; Secure;`,
        },
    });
});
