import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { ORB_API_URL, SITE_URL } from '@/constants/index.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { ORBSignInResponse } from '@/providers/orb/type.js';

export async function GET(request: NextRequest) {
    const url = urlcat(ORB_API_URL, '/init-sign-in');

    const response = await fetchJson<ORBSignInResponse>(url, {
        headers: {
            'web-access-token': env.internal.ORB_API_KEY,
            origin: SITE_URL,
        },
    });

    if (response.status !== 'SUCCESS') {
        return createErrorResponseJson('Failed to init sign in orb', {
            status: 502,
        });
    }

    return createSuccessResponseJson(response.data);
}
