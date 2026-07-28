import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { InitMediaSchema } from '@/schemas/Media.js';
import type { UploadMediaResponseV2 } from '@/types/twitter.js';

const postHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, InitMediaSchema);

        const client = await createTwitterClientV2(request);
        const { data } = await client.v2.post<{ data: UploadMediaResponseV2 }>('media/upload/initialize', {
            ...queryParams,
            total_bytes: Number(queryParams.total_bytes),
        });

        return createSuccessResponseJson(data);
    },
);

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
