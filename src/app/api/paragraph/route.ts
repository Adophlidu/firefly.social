import type { NextRequest } from 'next/server.js';

import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { ParagraphProcessor } from '@/providers/paragraph/Processor.js';

export async function GET(request: NextRequest) {
    const link = request.nextUrl.searchParams.get('link');
    if (!link) return createErrorResponseJson('Missing link', { status: 400 });

    try {
        const result = await ParagraphProcessor.digestDocumentUrl(link, request.signal);
        if (result) return result;

        return createErrorResponseJson(`Unable to digest paragraph link = ${link}`, {
            status: 502,
        });
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error), {
            status: 502,
        });
    }
}
