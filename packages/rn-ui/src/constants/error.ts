import { parseJson } from '@dimensiondev/utils';

export class FetchError extends Error {
    override name = 'FetchError';

    constructor(
        message: string,
        public url: string,
        public status: number,
        public statusText: string,
        public text: string,
    ) {
        super(message);
    }

    toThrow(): never {
        throw this;
    }

    static from(input: RequestInfo | URL | string, response: Response, text: string, message?: string) {
        const method = typeof input === 'string' ? 'GET' : input instanceof URL ? 'GET' : input.method.toUpperCase();

        return new FetchError(
            message ??
                [
                    `[fetch] failed to fetch: ${method} ${response.status} ${response.statusText} ${response.url}`,
                    text,
                ].join('\n'),
            response.url,
            response.status,
            response.statusText,
            text,
        );
    }

    get errorMessage() {
        const parsed = parseJson<{ error?: string[] | string }>(this.text);
        if (parsed?.error) return Array.isArray(parsed.error) ? parsed.error.join(', ') : parsed.error;
        return;
    }
}
