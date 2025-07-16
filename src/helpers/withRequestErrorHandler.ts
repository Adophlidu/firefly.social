import type { NextRequest } from 'next/server.js';
import { ZodError } from 'zod';

import { ContentTypeError, MalformedError, NotFoundError, UnauthorizedError } from '@/constants/error.js';
import { createErrorResponseJSON } from '@/helpers/createResponseJSON.js';
import type { NextRequestContext } from '@/types/index.js';

function handleZodErrorMessage(error: ZodError) {
    return (
        'InvalidParams: ' +
        error.issues.map((issue) => `(${issue.code})${issue.path.join('.')}: ${issue.message}`).join('; ')
    );
}

export function withRequestErrorHandler<P>(options?: { throwError?: boolean }) {
    const { throwError = false } = options ?? {};
    return (handler: (request: NextRequest, context?: NextRequestContext<P>) => Promise<Response>) => {
        return async (request: NextRequest, context?: NextRequestContext<P>) => {
            try {
                return await handler(request, context);
            } catch (error) {
                if (error instanceof ContentTypeError) {
                    return createErrorResponseJSON(error.message, {
                        status: 400,
                    });
                }
                if (error instanceof ZodError) {
                    return createErrorResponseJSON(handleZodErrorMessage(error), {
                        status: 400,
                    });
                }
                if (error instanceof MalformedError) {
                    return createErrorResponseJSON(error.message, {
                        status: 400,
                    });
                }
                if (error instanceof UnauthorizedError) {
                    return createErrorResponseJSON(error.message, {
                        status: 401,
                    });
                }
                if (error instanceof NotFoundError) {
                    return createErrorResponseJSON(error.message, {
                        status: 404,
                    });
                }
                if (!throwError) {
                    return createErrorResponseJSON(error instanceof Error ? error.message : 'Internal Server Error', {
                        status: 500,
                    });
                }

                throw error;
            }
        };
    };
}
