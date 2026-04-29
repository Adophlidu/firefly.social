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

export class EmailCodeLimitExceededError extends Error {
    override name = 'EmailCodeLimitExceededError';

    constructor(message = 'Email code limit exceeded') {
        super(message);
    }
}

export class FireflyApiError extends Error {
    override name = 'FireflyApiError';
    public code?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.code = code;
    }
}
