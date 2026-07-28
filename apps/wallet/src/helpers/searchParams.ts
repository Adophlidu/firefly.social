/**
 * Convert URLSearchParams into a plain object, JSON-parsing each value when
 * possible. This mirrors TanStack Router's default search parsing, so the
 * zod schemas and typed casts written against it keep working after the
 * migration to @dimensiondev/ssr (whose useSearch returns URLSearchParams).
 */
export function parseSearchParams(search: URLSearchParams): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of search.entries()) {
        try {
            result[key] = JSON.parse(value) as unknown;
        } catch {
            result[key] = value;
        }
    }

    return result;
}

/** Serialize a plain search object back into a query string (values JSON-encoded when needed). */
export function stringifySearch(search: Record<string, unknown> | undefined): string {
    if (!search) return '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
        if (value === undefined || value === null) continue;
        params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value as string | number | boolean));
    }

    const query = params.toString();
    return query ? `?${query}` : '';
}
