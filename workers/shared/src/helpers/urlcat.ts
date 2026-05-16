export function urlcat(
    hostname: string,
    pathname?: string,
    params?: Record<string, string | number | boolean | null | undefined>,
): string {
    // Ensure hostname doesn't end with `/`
    const trimmedHost = hostname.replace(/\/+$/, '');

    // Normalize pathname (optional)
    const normalizedPath = pathname
        ? `/${pathname.replace(/^\/+/, '')}` // ensure one leading slash
        : '';

    // Convert params safely to strings
    const search = params
        ? new URLSearchParams(
              Object.entries(params).reduce(
                  (acc, [key, value]) => {
                      if (typeof value === 'undefined' || value === null) return acc;
                      acc[key] = String(value);
                      return acc;
                  },
                  {} as Record<string, string>,
              ),
          ).toString()
        : '';

    return `${trimmedHost}${normalizedPath}${search ? `?${search}` : ''}`;
}
