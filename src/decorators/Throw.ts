/**
 * Replaces the method so every call throws the {@link Error} produced by `factory`.
 * @param factory Invoked on each call; must return an `Error` or subclass.
 */
export function Throw<E extends Error>(factory: () => E) {
    return function <This, Args extends readonly unknown[], Return>(
        _target: object,
        _propertyKey: string | number | symbol,
        descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Return>,
    ): TypedPropertyDescriptor<(this: This, ...args: Args) => Return> {
        if (typeof descriptor.value !== 'function') {
            throw new TypeError('@Throw can only be applied to methods');
        }
        descriptor.value = function (this: This, ..._args: Args): never {
            throw factory();
        };
        return descriptor;
    };
}
