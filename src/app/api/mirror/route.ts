import { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';

const MIRROR_GRAPHQL_URL = 'https://mirror.xyz/api/graphql';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const response = await fetchJson(MIRROR_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            Referer: 'https://mirror.xyz',
            origin: 'https://mirror.xyz',
        },
        signal: request.signal,
    });

    return createSuccessResponseJson(response);
}
