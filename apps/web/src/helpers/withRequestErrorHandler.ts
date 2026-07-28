import { IS_PRODUCTION } from '@dimensiondev/constants';
import { reportExceptionServer } from '@dimensiondev/exception-tracker';
import type { NextRequestContext } from '@dimensiondev/types';
import { NotFoundError, parseJson, UnauthorizedError } from '@dimensiondev/utils';
import type { NextRequest } from '@/compat/next-server.js';
import { ZodError } from 'zod';

import { AccountSuspendedError, MalformedRequestError } from '@/constants/error.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { configureErrorCapture } from '@/providers/errorCapture/configure.js';

// Ensure exception tracker is configured for server-side reporting
configureErrorCapture();

type Handler<T> = (request: NextRequest, context?: NextRequestContext<T>) => Promise<Response>;

export function withRequestErrorHandler<P>(options?: { throwError?: boolean }) {
    const { throwError = false } = options ?? {};

    return (handler: Handler<P>) => {
        return async (request: NextRequest, context?: NextRequestContext<P>) => {
            try {
                return await handler(request, context);
            } catch (error) {
                if (error instanceof ZodError) {
                    return createErrorResponseJson(parseJson(error.message) ?? error.message, {
                        status: 400,
                    });
                }
                if (error instanceof MalformedRequestError) {
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
                if (error instanceof AccountSuspendedError) {
                    return createErrorResponseJson(error.message, {
                        status: 404,
                    });
                }
                if (!throwError) {
                    // Report server-side API errors to firefly-exception-tracker
                    if (!request.url.includes('/api/beacon/exceptions')) {
                        await reportExceptionServer(error, {
                            request_url: request.url,
                        });
                    }

                    const err = error instanceof Error ? error : new Error(String(error));
                    return createErrorResponseJson(IS_PRODUCTION ? 'Internal server error' : err.message, {
                        status: 500,
                    });
                }

                throw error;
            }
        };
    };
}
