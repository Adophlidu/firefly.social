import { bom } from '@/helpers/bom.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';

export function MemoizePromise(resolver: (...args: any[]) => string) {
    return function <T extends Object, K extends keyof T>(
        target: T,
        propertyKey: K,
        descriptor: TypedPropertyDescriptor<any>,
    ) {
        if (!bom.window) return descriptor;
        const originalMethod = descriptor.value;
        let memoized: typeof originalMethod;

        descriptor.value = function (...args: any[]) {
            if (!memoized) {
                memoized = memoizePromise(originalMethod.bind(this), resolver);
            }
            return memoized(...args);
        };

        return descriptor;
    };
}
