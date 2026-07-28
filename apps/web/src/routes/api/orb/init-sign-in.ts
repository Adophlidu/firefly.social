import { ORB_API_URL } from '@dimensiondev/constants/static';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { NextRequest } from '@/compat/next-server.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { SignInResponse } from '@/providers/orb/type.js';

const getHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = urlcat(ORB_API_URL, '/init-sign-in', { credentials: 'id_access_refresh' });
    const response = await fetchOrbJson<SignInResponse>(url);
    return createResponseJsonFromOrb(response, 'Failed to init sign in orb');
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
