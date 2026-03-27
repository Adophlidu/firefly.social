import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { ORB_API_URL } from '@/constants/static.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { type SignInResponse } from '@/providers/orb/type.js';

export const runtime = 'edge';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = urlcat(ORB_API_URL, '/init-sign-in', { credentials: 'id_access_refresh' });
    const response = await fetchOrbJson<SignInResponse>(url);
    return createResponseJsonFromOrb(response, 'Failed to init sign in orb');
});
