import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { ORB_API_URL, SITE_URL } from '@/constants/index.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { ORBPollSignInResponse } from '@/providers/orb/type.js';

export async function POST(request: NextRequest) {
    const { secret } = await request.json();

    if (!secret) return createErrorResponseJSON('Secret is required', { status: 400 });

    const url = urlcat(ORB_API_URL, '/poll-sign-in');

    const response = await fetchJSON<ORBPollSignInResponse>(url, {
        headers: {
            'web-access-token': env.internal.ORB_API_KEY,
            origin: SITE_URL,
        },
        body: JSON.stringify({
            secret,
        }),
        method: 'POST',
    });

    if (response.status !== 'SUCCESS') {
        return createErrorResponseJSON('Failed to poll sign in orb', {
            status: 502,
        });
    }

    return createSuccessResponseJSON(response.data);
}
