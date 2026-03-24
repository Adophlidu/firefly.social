/**
 * Replaces the method so every call throws the {@link Error} produced by `factory`,
 * or (when `when` is set) wraps the method and throws only if `when()` is true.
 * @param factory Invoked on each call; must return an `Error` or subclass.
 * @param when When provided and returns true, `factory()` is thrown instead of running the method.
 */
export function Throw<E extends Error>(factory: () => E, when?: () => boolean) {
    return function <This, Args extends readonly unknown[], Return>(
        _target: object,
        _propertyKey: string | number | symbol,
        descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Return>,
    ): TypedPropertyDescriptor<(this: This, ...args: Args) => Return> {
        if (typeof descriptor.value !== 'function') {
            throw new TypeError('@Throw can only be applied to methods');
        }
        if (when) {
            const original = descriptor.value;
            descriptor.value = function (this: This, ...args: Args): Return {
                if (when()) throw factory();
                return Reflect.apply(original, this, args) as Return;
            };
        } else {
            descriptor.value = function (this: This, ..._args: Args): never {
                throw factory();
            };
        }
        return descriptor;
    };
}
