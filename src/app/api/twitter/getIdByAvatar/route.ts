import type { NextRequest } from 'next/server.js';

import { createErrorResponseJson, createResponseJson } from '@/helpers/createResponseJson.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';

export async function GET(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('target');
    if (!target) return new Response('Missing target', { status: 400 });
    try {
        const response = await fetch(target, {
            method: 'GET',
            redirect: 'manual',
        });

        if (response.status === 302) {
            const location = response.headers.get('Location');
            if (!location) return new Response('Missing location', { status: 400 });

            return createResponseJson({
                twitterId: new URL(location).searchParams.get('twitterId'),
            });
        }
        return createErrorResponseJson('Not Found', {
            status: 404,
        });
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error, 'Failed to get twitter avatar'), {
            status: 400,
        });
    }
}
