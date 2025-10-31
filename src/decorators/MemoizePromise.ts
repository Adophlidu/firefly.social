import { bom } from '@dimensiondev/utils';

function memoizePromise<T extends (...args: unknown[]) => Promise<unknown>>(
    func: T,
    resolver: (...args: Parameters<T>) => string,
): T {
    const cache = new Map<string, Promise<unknown>>();
    const memoized = function (this: unknown, ...args: Parameters<T>) {
        const key = resolver(...args);
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const result = func.apply(this, args);
        cache.set(key, result);
        result.catch(() => cache.delete(key));
        return result;
    };

    return memoized as T;
}

export function MemoizePromise<T extends (...args: any[]) => Promise<any>>(
    resolver: (...args: Parameters<T>) => string,
) {
    return function <K extends string | number | symbol>(
        target: object,
        propertyKey: K,
        descriptor: TypedPropertyDescriptor<T>,
    ): TypedPropertyDescriptor<T> {
        if (!bom.window) return descriptor;
        const originalMethod = descriptor.value!;
        const memoizedMethod = memoizePromise(originalMethod, resolver);

        descriptor.value = function (this: any, ...args: any[]) {
            return memoizedMethod.apply(this, args);
        } as unknown as T;
        return descriptor;
    };
}
