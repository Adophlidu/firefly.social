import { bom } from '@/helpers/bom.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';

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
        let memoized: T | undefined;

        Object.defineProperty(target, propertyKey, {
            value(...args: Parameters<T>): ReturnType<T> {
                if (!memoized) {
                    memoized = memoizePromise(originalMethod.bind(target) as T, resolver);
                }
                return memoized(...args) as ReturnType<T>;
            },
        });
        return descriptor;
    };
}
