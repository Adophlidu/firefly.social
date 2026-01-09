import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    return createSuccessResponseJson({ message: 'OK' });
});
