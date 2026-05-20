import { TWITTER_UPLOAD_MEDIA_URL } from '@dimensiondev/constants/static';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { InitMediaSchema } from '@/schemas/Media.js';
import type { UploadMediaResponse } from '@/types/twitter.js';

export const POST = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const queryParams = getSearchParamsWithZodSchema(request, InitMediaSchema);

        const client = await createTwitterClientV2();
        const { media_id_string } = await client.post<UploadMediaResponse>(
            urlcat(TWITTER_UPLOAD_MEDIA_URL, {
                ...queryParams,
                command: 'INIT',
            }),
        );

        return createSuccessResponseJson({ media_id: media_id_string, media_id_string });
    },
);
