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
        const memoizedMethod = memoizePromise(originalMethod, resolver);

        Object.defineProperty(descriptor, 'value', {
            value(...args: Parameters<T>): ReturnType<T> {
                return memoizedMethod.apply(target, args) as ReturnType<T>;
            },
        });
        return descriptor;
    };
}
