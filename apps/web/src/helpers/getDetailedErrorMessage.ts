import { isNetworkError } from '@/helpers/isNetworkError.js';

export function getDetailedErrorMessage(error: unknown) {
    if (!(error instanceof Error)) return `${error}`;
    // Network errors surface the browser's raw `TypeError` (e.g. "Failed to
    // fetch") verbatim, which is meaningless. Replace it with a readable
    // message. Like the raw stacks returned for other errors, this is technical
    // detail (not localized).
    if (isNetworkError(error)) {
        return 'Network error — the request could not reach the server. Check your connection and try again.';
    }
    const lines = error.stack ? [error.stack] : [error.message];
    lines.push('');
    return lines.join('\n').trim();
}
