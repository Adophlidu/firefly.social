import { compose } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { ContentTypeError } from '@/constants/error.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createTwitterClientV2 } from '@/providers/twitter/createTwitterClientV2.js';
import { convertTwitterAvatar } from '@/providers/twitter/formatTwitterProfile.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { FileSchema } from '@/schemas/index.js';
import type { NextRequestContext } from '@/types/utility.js';

const FormDataSchema = z.object({
    file: FileSchema,
});

export const PUT = compose<(request: NextRequest, context?: NextRequestContext) => Promise<Response>>(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request) => {
        const client = await createTwitterClientV2();
        const formData = await request.formData().catch((error) => {
            throw new ContentTypeError(error.message);
        });
        const { file } = FormDataSchema.parse({
            file: formData.get('file'),
        });
        const user = await client.v1.updateAccountProfileImage(Buffer.from(await file.arrayBuffer()));

        return createSuccessResponseJson({
            pfp: convertTwitterAvatar(user.profile_image_url_https),
        });
    },
);
