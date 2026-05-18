import { ServerErrorCodes } from '@dimensiondev/enums';

export function createResponseJson(data: unknown, init?: ResponseInit) {
    const status = init?.status ?? 200;

    return Response.json(data, {
        status,
        ...init,
    });
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
