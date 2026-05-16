import type { core } from 'zod';
import { ZodError } from 'zod';

import { RecognizableError } from '@/shared/src/constants/error.js';
import { parseJson } from '@/shared/src/helpers/parseJson.js';

function createResponseJson(data: unknown, init?: ResponseInit) {
    const status = init?.status ?? 200;

    return Response.json(data, {
        status,
        ...init,
    });
}

enum ServerErrorCodes {
    UNKNOWN = 40001,
}

export function createErrorResponseJson(message: string, init?: Omit<ResponseInit, 'headers'>) {
    return createResponseJson(
        {
            success: false,
            error: {
                code: ServerErrorCodes.UNKNOWN,
                message,
            },
        },
        {
            status: 500,
            ...init,
        },
    );
}

export function createZodErrorResponseJson(result: core.$ZodError<unknown>, init?: Omit<ResponseInit, 'headers'>) {
    return createErrorResponseJson(parseJson(result.message) ?? result.message, {
        status: 500,
        ...init,
    });
}

export function createSuccessResponseJson(data: unknown, init?: ResponseInit) {
    return createResponseJson(
        {
            success: true,
            data,
        },
        {
            status: 200,
            ...init,
        },
    );
}

export function createErrorResponseJsonFromError(error: unknown, init?: Omit<ResponseInit, 'headers'>) {
    if (error instanceof ZodError) {
        return createZodErrorResponseJson(error, {
            status: 502,
            ...init,
        });
    }
    if (error instanceof RecognizableError) {
        return createErrorResponseJson(error.message, {
            status: 200,
            ...init,
        });
    }

    return createErrorResponseJson(error instanceof Error ? error.message : 'Unknown Error', {
        status: 502,
        ...init,
    });
}
