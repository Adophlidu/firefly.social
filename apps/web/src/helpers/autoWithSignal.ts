export function autoWithSignal<T extends (signal: AbortSignal, ...args: any[]) => any>(
    func: T,
): (...args: Parameters<T> extends [AbortSignal, ...infer R] ? R : never) => Promise<ReturnType<T>> {
    let lastController = new AbortController();

    const innerFunc = async (
        ...args: Parameters<T> extends [AbortSignal, ...infer R] ? R : never
    ): Promise<ReturnType<T>> => {
        const newController = new AbortController();

        lastController.abort();
        lastController = newController;

        return func(newController.signal, ...args);
    };

    return innerFunc;
}
