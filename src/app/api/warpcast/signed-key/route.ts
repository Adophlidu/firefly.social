import { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { waitForSignedKeyRequest } from '@/providers/farcaster/waitForSignedKeyRequest.js';

const Schema = z.object({
    token: z.string(),
});

export const maxDuration = 300;

export async function GET(request: NextRequest) {
    try {
        const { token } = Schema.parse({
            token: request.nextUrl.searchParams.get('token'),
        });
        const result = await waitForSignedKeyRequest(request.signal)(token);
        return createSuccessResponseJson(result);
    } catch (error) {
        if (error instanceof Error) return createErrorResponseJson(error.message);
        return createErrorResponseJson('Unknown error');
    }
}
