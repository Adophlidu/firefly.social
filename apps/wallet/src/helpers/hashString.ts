/**
 * Simple hash function using djb2 algorithm.
 * Used for creating cache keys from JWT tokens.
 */
export function hashString(str: string): string {
    let hash = 5381;
    // eslint-disable-next-line no-plusplus, no-bitwise
    for (let i = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i);

    // eslint-disable-next-line no-bitwise
    return (hash >>> 0).toString(36);
}
