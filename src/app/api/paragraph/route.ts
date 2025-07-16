import type { NextRequest } from 'next/server.js';

import { createErrorResponseJSON } from '@/helpers/createResponseJSON.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { ParagraphProcessor } from '@/providers/paragraph/Processor.js';

export async function GET(request: NextRequest) {
    const link = request.nextUrl.searchParams.get('link');
    if (!link) return createErrorResponseJSON('Missing link', { status: 400 });

    try {
        const result = await ParagraphProcessor.digestDocumentUrl(link, request.signal);
        if (result) return result;

        return createErrorResponseJSON(`Unable to digest paragraph link = ${link}`, {
            status: 502,
        });
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error), {
            status: 502,
        });
    }
}
