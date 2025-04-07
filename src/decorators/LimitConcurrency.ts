interface Options {
    disabled?: () => boolean;
}

export function LimitConcurrency(limit: number, options?: Options) {
    const queue: Array<{ resolve: Function; reject: Function; fn: Function; args: any[] }> = [];
    let activeCount = 0;

    async function next() {
        if (queue.length > 0 && activeCount < limit) {
            const { resolve, reject, fn, args } = queue.shift()!;
            activeCount += 1;
            try {
                resolve(await fn(...args));
            } catch (error) {
                reject(error);
            } finally {
                activeCount -= 1;
                next();
            }
        }
    }

    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        if (options?.disabled?.() === true) return;
        for (const key of Object.getOwnPropertyNames(constructor.prototype)) {
            const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, key);
            if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
                const originalMethod = descriptor.value;
                Object.defineProperty(constructor.prototype, key, {
                    value(...args: any[]) {
                        return new Promise((resolve, reject) => {
                            queue.push({ resolve, reject, fn: originalMethod.bind(this), args });
                            next();
                        });
                    },
                });
            }
        }
    };
}
