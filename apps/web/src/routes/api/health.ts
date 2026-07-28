import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';

import type { NextRequest } from '@/compat/next-server.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    return createSuccessResponseJson({ message: 'OK' });
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
