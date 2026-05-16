export class AbortError extends Error {
    override name = 'AbortError';

    constructor(message = 'Aborted') {
        super(message);
    }

    static is(error: unknown) {
        return error instanceof AbortError || (error instanceof DOMException && error.name === 'AbortError');
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

export class RecognizableError extends Error {
    override name = 'RecognizableError';

    constructor(
        message: string,
        public isRecognized = false,
    ) {
        super(message ?? 'Recognizable error.');
    }
}
