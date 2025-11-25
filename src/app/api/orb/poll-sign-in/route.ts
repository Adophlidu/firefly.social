import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { ORB_API_URL } from '@/constants/index.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { createResponseJsonFromOrb } from '@/helpers/createResponseJsonFromOrb.js';
import { fetchOrbJson } from '@/helpers/fetchOrbJson.js';
import type { PollSignInResponse } from '@/providers/orb/type.js';

export async function POST(request: NextRequest) {
    const { secret } = await request.json();
    if (!secret) return createErrorResponseJson('Secret is required', { status: 400 });

    const url = urlcat(ORB_API_URL, '/poll-sign-in');
    const response = await fetchOrbJson<PollSignInResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            secret,
        }),
    });
    return createResponseJsonFromOrb(response, 'Failed to poll sign in orb');
}
