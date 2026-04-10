export class SeverityError extends Error {
    override name = 'SeverityError';

    constructor(
        message: string,
        public level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'log',
    ) {
        super(message);
    }
}

export class AbortError extends Error {
    override name = 'AbortError';

    constructor(message = 'Aborted') {
        super(message);
    }

    static is(error: unknown) {
        return error instanceof AbortError || (error instanceof DOMException && error.name === 'AbortError');
    }
}

export class InvalidAddressError extends Error {
    override name = 'InvalidAddressError';

    constructor(address: string, message?: string) {
        super(message ?? `Invalid EVM address: ${address}.`);
    }
}

/**
 * Error thrown when a Bluesky XRPC endpoint is not supported (404).
 * This is expected when using custom PDS instances that don't support all endpoints.
 * Should be handled gracefully without logging to error tracking.
 */
export class XRPCNotSupportedError extends Error {
    override name = 'XRPCNotSupportedError';

    constructor(message?: string) {
        super(message ?? 'XRPC not supported.');
    }

    static is(error: unknown) {
        if (!error || typeof error !== 'object') return false;

        const err = error as Record<string, unknown>;

        const isXRPCNotSupported =
            err.error === 'XRPCNotSupported' ||
            err.message === 'XRPCNotSupported' ||
            (typeof err.message === 'string' && err.message.includes('XRPCNotSupported'));

        const is404 = err.status === 404;

        return isXRPCNotSupported && is404;
    }
}

export class InvalidResultError extends Error {
    override name = 'InvalidResultError';

    constructor() {
        super('Invalid result.');
    }
}

export class TimeoutError extends Error {
    override name = 'TimeoutError';

    constructor(message?: string) {
        super(message ?? 'Timeout.');
    }
}

export class UnreachableError extends Error {
    override name = 'UnreachableError';

    constructor(label: string, value: unknown) {
        super(`Unreachable ${label} = ${value}.`);
    }
}

export class NotImplementedError extends Error {
    override name = 'NotImplementedError';

    constructor(message?: string) {
        super(message ?? 'Not implemented.');
    }
}

export class NotAllowedError extends Error {
    override name = 'NotAllowedError';

    constructor(message?: string) {
        super(message ?? 'Not allowed.');
    }
}

export class NotFoundError extends Error {
    override name = 'NotFoundError';

    constructor(message?: string) {
        super(message ?? 'Not Found.');
    }
}

export class AuthenticationError extends SeverityError {
    override name = 'AuthenticationError';

    constructor(message?: string) {
        super(message ?? 'Failed to authenticate');
    }
}

export class UnauthorizedError extends Error {
    override name = 'UnauthorizedError';

    constructor(message?: string) {
        super(message ?? 'Unauthorized');
    }
}

export class ForbiddenError extends Error {
    override name = 'ForbiddenError';

    constructor(message?: string) {
        super(message ?? 'Forbidden');
    }
}

export class NetworkError extends Error {
    override name = 'NetworkError';

    constructor(message?: string) {
        super(message ?? 'Network error');
    }
}

export class UserRejectionError extends Error {
    override name = 'UserRejectionError';

    constructor(message?: string) {
        super(message ?? 'User rejected.');
    }
}
