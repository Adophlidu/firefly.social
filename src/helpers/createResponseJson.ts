import type { ZodError } from 'zod';

import { parseJson } from '@/helpers/parseJson.js';

export function createResponseJson(data: unknown, init?: ResponseInit) {
    const status = init?.status ?? 200;

    return Response.json(data, {
        status,
        ...init,
    });
}

export enum ServerErrorCodes {
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

export function createZodErrorResponseJson(result: ZodError<unknown>, init?: Omit<ResponseInit, 'headers'>) {
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
