import { compose } from '@dimensiondev/utils';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { InitMediaSchema } from '@/schemas/Media.js';
import { type UploadMediaResponseV2 } from '@/types/twitter.js';

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, InitMediaSchema);

        const client = await createTwitterClientV2();
        const { data } = await client.v2.post<{ data: UploadMediaResponseV2 }>('media/upload/initialize', {
            ...queryParams,
            total_bytes: Number(queryParams.total_bytes),
        });

        return createSuccessResponseJson(data);
    },
);
