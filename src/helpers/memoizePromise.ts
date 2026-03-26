import { memoize } from 'lodash-es';

/**
 * The promise version of lodash-es/memoize
 * @param f An async function
 * @param resolver A function used to map the param the memoize key.
 */
export function memoizePromise<T extends (...args: any[]) => Promise<any>>(
    f: T,
    resolver: (...args: Parameters<T>) => string,
) {
    const memorizedFunction = memoize(
        async function (...args: unknown[]) {
            try {
                // ? DO NOT remove "await" here
                return await f(...args);
            } catch (error) {
                memorizedFunction.cache.delete(resolver(...(args as Parameters<T>)));
                throw error;
            }
        } as T,
        resolver,
    );
    return memorizedFunction as T;
}

/**
 * @param options.cacheTime cache time in seconds
 */
export function memoizePromiseWithTime<T extends (...args: any[]) => Promise<any>>(
    f: T,
    resolver: (...args: Parameters<T>) => string,
    options: {
        cacheTime: number; // in seconds
    },
) {
    const taskCache = new Map<string, Promise<ReturnType<T>>>();
    const resultCache = new Map<
        string,
        {
            data: ReturnType<T>;
            time: number;
        }
    >();

    const memorizedFunction = async (...args: Parameters<T>) => {
        const key = resolver(...args);
        if (taskCache.has(key)) return taskCache.get(key);

        const cachedResult = resultCache.get(key);
        if (cachedResult && Date.now() - cachedResult.time < options.cacheTime * 1000) {
            return cachedResult.data;
        }

        const promise = new Promise<ReturnType<T>>(async (resolve, reject) => {
            try {
                const result = await f(...args);
                resultCache.set(key, {
                    data: result,
                    time: Date.now(),
                });
                taskCache.delete(key);

                resolve(result);
            } catch (error) {
                taskCache.delete(key);
                resultCache.delete(key);

                reject(error);
            }
        });
        taskCache.set(key, promise);

        return promise;
    };

    memorizedFunction.clear = () => {
        taskCache.clear();
        resultCache.clear();
    };

    return memorizedFunction as T & {
        clear: () => void;
    };
}
