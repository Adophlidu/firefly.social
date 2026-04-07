export class UnreachableError extends Error {
    override name = 'UnreachableError';

    constructor(label: string, value: unknown) {
        super(`Unreachable ${label} = ${value}.`);
    }
}

export class AbortError extends Error {
    override name = 'AbortError';

    constructor(message = 'The operation was aborted.') {
        super(message);
    }

    static is(error: unknown): error is AbortError | DOMException {
        if (!error || typeof error !== 'object') return false;
        if (error instanceof AbortError) return true;
        if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
            return error.name === 'AbortError';
        }
        return 'name' in error && (error as { name?: string }).name === 'AbortError';
    }
}

export class InvalidPolymarketAccountError extends Error {
    override name = 'InvalidPolymarketAccountError';
}

export class MarketNotFoundError extends Error {
    override name = 'MarketNotFoundError';

    constructor(message = 'Market not found') {
        super(message);
    }
}

export class InsufficientGasError extends Error {
    override name = 'InsufficientGasError';

    constructor(message = 'Insufficient gas') {
        super(message);
    }

    static is(error: unknown): error is InsufficientGasError {
        return error instanceof InsufficientGasError;
    }
}
