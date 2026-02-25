/**
 * Extracts a readable message from an unknown value.
 * Plain objects stringify to "[object Object]" - this produces meaningful output.
 */
export function getErrorMessage(value: unknown): string {
    if (value instanceof Error) {
        return value.message;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (value !== null && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const msg = obj.message ?? obj.error ?? obj.err ?? obj.msg ?? obj.reason;
        if (typeof msg === 'string') {
            return msg;
        }
        if (msg instanceof Error) {
            return msg.message;
        }

        try {
            const str = JSON.stringify(value);
            return str.length > 500 ? str.slice(0, 500) + '...' : str;
        } catch {
            return 'Unknown error (object could not be serialized)';
        }
    }
    return String(value);
}
