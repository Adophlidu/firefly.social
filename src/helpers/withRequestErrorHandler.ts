import { parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { ZodError } from 'zod';

import { ContentTypeError, MalformedError, NotFoundError, UnauthorizedError } from '@/constants/error.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import type { NextRequestContext } from '@/types/utility.js';

export function withRequestErrorHandler<P>(options?: { throwError?: boolean }) {
    const { throwError = false } = options ?? {};
    return (handler: (request: NextRequest, context?: NextRequestContext<P>) => Promise<Response>) => {
        return async (request: NextRequest, context?: NextRequestContext<P>) => {
            try {
                return await handler(request, context);
            } catch (error) {
                if (error instanceof ContentTypeError) {
                    return createErrorResponseJson(error.message, {
                        status: 400,
                    });
                }
                if (error instanceof ZodError) {
                    return createErrorResponseJson(parseJson(error.message) ?? error.message, {
                        status: 400,
                    });
                }
                if (error instanceof MalformedError) {
                    return createErrorResponseJson(error.message, {
                        status: 400,
                    });
                }
                if (error instanceof UnauthorizedError) {
                    return createErrorResponseJson(error.message, {
                        status: 401,
                    });
                }
                if (error instanceof NotFoundError) {
                    return createErrorResponseJson(error.message, {
                        status: 404,
                    });
                }
                if (!throwError) {
                    return createErrorResponseJson(error instanceof Error ? error.message : 'Internal Server Error', {
                        status: 500,
                    });
                }

                throw error;
            }
        };
    };
}
