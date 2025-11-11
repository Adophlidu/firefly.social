export function addHeader(headers: HeadersInit, key: string, value: string, force = true): HeadersInit {
    if (!headers) return { [key]: value };

    if (headers instanceof Headers) {
        if (!force && headers.has(key)) return headers;
        const newHeaders = new Headers(headers);
        newHeaders.set(key, value);
        return newHeaders;
    }
    if (Array.isArray(headers)) {
        if (!force && headers.some(([k]) => k === key)) return headers;
        const newHeaders = [...headers];
        newHeaders.push([key, value]);
        return newHeaders;
    }
    if (headers && typeof headers === 'object') {
        if (!force && Object.hasOwn(headers, key)) return headers;
        return {
            ...headers,
            [key]: value,
        };
    }

    console.warn(`[addHeader] Failed to add header [${key}]=${value} due to invalid headers type:`, typeof headers);
    return headers;
}

export function addHeaders(headers: HeadersInit, otherHeaders: Record<string, string>): HeadersInit {
    return Object.entries(otherHeaders).reduce((acc, [key, value]) => addHeader(acc, key, value), headers);
}
