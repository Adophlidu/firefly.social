export function createLookupTableResolver<K extends string, T>(map: Record<K, T>, fallback: T | ((key: K) => T)) {
    function resolveFallback(key: K) {
        if (typeof fallback === 'function') return (fallback as (key: K) => T)(key);
        return fallback;
    }
    return (key: K) => map[key] ?? resolveFallback(key);
}
