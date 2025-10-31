const CACHE = new Map<
    string,
    {
        timestamp: number;
        result: Promise<unknown>;
    }
>();

export function squashCallback<T extends (...args: unknown[]) => Promise<unknown>>(
    callback: T,
    options?: {
        expiration?: number;
        resolver?: (...args: Parameters<T>) => string;
    },
) {
    return (...args: Parameters<T>): ReturnType<T> => {
        const { expiration = 1000, resolver = (...args: Parameters<T>) => args.join(',') } = options ?? {};

        const key = resolver(...args);
        const hit = CACHE.get(key);

        try {
            if (hit && hit.timestamp + expiration > Date.now()) return hit.result as ReturnType<T>;
        } catch {
            CACHE.delete(key);
        }

        const result = callback(...args);
        CACHE.set(key, {
            timestamp: Date.now(),
            result,
        });

        return result as ReturnType<T>;
    };
}
