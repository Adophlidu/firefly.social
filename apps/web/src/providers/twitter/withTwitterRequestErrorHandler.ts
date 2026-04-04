import { type NextRequest } from 'next/server.js';

import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { getTwitterErrorMessage } from '@/providers/twitter/getTwitterErrorMessage.js';
import { type NextRequestContext } from '@/types/utility.js';

export function withTwitterRequestErrorHandler(
    handler: (request: NextRequest, context?: NextRequestContext) => Promise<Response>,
) {
    return async (request: NextRequest, context?: NextRequestContext) => {
        try {
            return await handler(request, context);
        } catch (error) {
            const { status, message } = getTwitterErrorMessage(error);
            return createErrorResponseJson(message, {
                status: status ?? 500,
            });
        }
    };
}
