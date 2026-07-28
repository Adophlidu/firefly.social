import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getFormDataWithZodSchema } from '@/helpers/getFormDataWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { convertTwitterAvatar } from '@/providers/twitter/formatTwitterProfile.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FileSchema } from '@/schemas/File.js';

const FormDataSchema = z.object({
    file: FileSchema,
});

const putHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const { file } = await getFormDataWithZodSchema(request, FormDataSchema);

        const client = await createTwitterClientV2(request);
        const user = await client.v1.updateAccountProfileImage(Buffer.from(await file.arrayBuffer()));

        return createSuccessResponseJson({
            pfp: convertTwitterAvatar(user.profile_image_url_https),
        });
    },
);

export function PUT({ request }: ApiContext) {
    return putHandler(request as NextRequest);
}
