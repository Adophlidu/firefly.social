export type DeferTuple<T, E = unknown> = [Promise<T>, (value: T | PromiseLike<T>) => void, (reason: E) => void];

/**
 * Creates a deferred promise that can be resolved or rejected externally
 * Useful for creating promises that need to be controlled from outside their execution context
 *
 * @returns A tuple containing [promise, resolve, reject]
 *
 * @example
 * ```typescript
 * const [promise, resolve, reject] = defer<string>();
 *
 * // Later...
 * resolve('success');
 * // or
 * reject(new Error('failed'));
 * ```
 */
export function defer<T, E = unknown>(): DeferTuple<T, E> {
    let a!: (val: T | PromiseLike<T>) => void, b!: (err: E) => void;
    const p = new Promise<T>((x, y) => {
        a = x;
        b = y;
    });
    return [p, a, b];
}
