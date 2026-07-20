/** Thrown by `redirect()`, caught by the server handler / client router. */
export class RedirectError extends Error {
    constructor(
        readonly url: string,
        readonly status: 301 | 302 | 307 | 308 = 302,
    ) {
        super(`Redirect to ${url}`);
        this.name = 'RedirectError';
    }
}

export function isRedirectError(error: unknown): error is RedirectError {
    return error instanceof RedirectError;
}

/**
 * Redirect from a loader or API handler by throwing. On the server this
 * becomes a 3xx response; during client-side navigation the router follows
 * it without a full page load.
 */
export function redirect(url: string, status: 301 | 302 | 307 | 308 = 302): never {
    throw new RedirectError(url, status);
}

/** Thrown by `notFound()`, caught by the server handler / client router. */
export class NotFoundError extends Error {
    constructor(message = 'Not Found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export function isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
}

/**
 * Signal that the current match has no content. The server renders the
 * nearest `notFoundComponent` with a 404 status; without one it falls back
 * to the handler's plain 404.
 */
export function notFound(message?: string): never {
    throw new NotFoundError(message);
}
