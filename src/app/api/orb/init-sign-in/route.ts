import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { ORB_API_URL, SITE_URL } from '@/constants/index.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { ORBSignInResponse } from '@/providers/orb/type.js';

export async function GET(request: NextRequest) {
    const url = urlcat(ORB_API_URL, '/init-sign-in');

    const response = await fetchJSON<ORBSignInResponse>(url, {
        headers: {
            'web-access-token': env.internal.ORB_API_KEY,
            origin: SITE_URL,
        },
    });

    if (response.status !== 'SUCCESS') {
        return createErrorResponseJSON('Failed to init sign in orb', {
            status: 502,
        });
    }

    return createSuccessResponseJSON(response.data);
}
