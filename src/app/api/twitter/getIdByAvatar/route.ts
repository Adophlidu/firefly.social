import { StatusCodes } from 'http-status-codes';
import type { NextRequest } from 'next/server.js';

import { createErrorResponseJSON, createResponseJSON } from '@/helpers/createResponseJSON.js';
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
            const twitterId = new URL(location).searchParams.get('twitterId');

            return createResponseJSON({
                twitterId,
            });
        }
        return createErrorResponseJSON('Not Found', {
            status: StatusCodes.NOT_FOUND,
        });
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error, 'Failed to get twitter avatar'), {
            status: StatusCodes.BAD_REQUEST,
        });
    }
}
