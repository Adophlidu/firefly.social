export function createResponseJSON(data: unknown, init?: ResponseInit) {
    const status = init?.status ?? 200;

    return Response.json(data, {
        status,
        ...init,
    });
}

export enum ServerErrorCodes {
    UNKNOWN = 40001,
}

export function createErrorResponseJSON(message: string, init?: Omit<ResponseInit, 'headers'>) {
    return createResponseJSON(
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

export function createSuccessResponseJSON(data: unknown, init?: ResponseInit) {
    return createResponseJSON(
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
