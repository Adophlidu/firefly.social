/**
 * Parses a JWT token and extracts the expiration timestamp.
 * Returns the expiration time in milliseconds, or null if parsing fails.
 */
export function parseJwtExpiration(token: string): number | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        if (!payload) return null;

        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(decoded) as { exp?: number };

        if (typeof parsed.exp !== 'number') return null;

        // JWT exp is in seconds, convert to milliseconds
        return parsed.exp * 1000;
    } catch {
        return null;
    }
}
