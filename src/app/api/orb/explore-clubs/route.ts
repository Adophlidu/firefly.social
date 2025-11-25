import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { ORB_API_URL, SITE_URL } from '@/constants/index.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';

export async function POST(request: NextRequest) {
    const body = await request.json();

    const url = urlcat(ORB_API_URL, '/explore-clubs');

    try {
        const response = await fetchJson(url, {
            headers: {
                'web-access-token': env.internal.ORB_API_KEY,
                origin: SITE_URL,
            },
            body: JSON.stringify(body),
            method: 'POST',
        });

        return createSuccessResponseJson(response);
    } catch (error) {
        return createErrorResponseJson('Failed to fetch explore clubs', {
            status: 502,
        });
    }
}
