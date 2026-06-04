import { bom } from '@dimensiondev/utils';

// Like MemoizePromise, but evicts on settle: only concurrent in-flight calls
// share a request; later calls re-fetch.
function dedupePromise<T extends (...args: unknown[]) => Promise<unknown>>(
    func: T,
    resolver: (...args: Parameters<T>) => string,
): T {
    const inFlight = new Map<string, Promise<unknown>>();
    const deduped = function (this: unknown, ...args: Parameters<T>) {
        const key = resolver(...args);
        if (inFlight.has(key)) {
            return inFlight.get(key)!;
        }
        const result = func.apply(this, args);
        inFlight.set(key, result);
        result.finally(() => inFlight.delete(key));
        return result;
    };

    return deduped as T;
}

export function DedupPromise<T extends (...args: any[]) => Promise<any>>(resolver: (...args: Parameters<T>) => string) {
    return function <K extends string | number | symbol>(
        target: object,
        propertyKey: K,
        descriptor: TypedPropertyDescriptor<T>,
    ): TypedPropertyDescriptor<T> {
        if (!bom.window) return descriptor;
        const originalMethod = descriptor.value!;
        const dedupedMethod = dedupePromise(originalMethod, resolver);

        descriptor.value = function (this: any, ...args: any[]) {
            return dedupedMethod.apply(this, args);
        } as unknown as T;
        return descriptor;
    };
}
