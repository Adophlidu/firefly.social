interface Options {
    disabled?: () => boolean;
    priority?: string[];
}

export function LimitConcurrency(limit: number, options?: Options) {
    interface Task {
        resolve: Function;
        reject: Function;
        fn: Function;
        args: any[];
        name: string;
    }
    const queue: Task[] = [];
    let activeCount = 0;

    function insertByPriority(task: Task) {
        if (!options?.priority) {
            queue.push(task);
            return;
        }

        const priorityList = options.priority;
        const taskPriority = priorityList.indexOf(task.name);

        const insertPriority = taskPriority === -1 ? Infinity : taskPriority;

        let i = 0;
        for (; i < queue.length; i += 1) {
            const currentPriority = priorityList.indexOf(queue[i].name);
            const current = currentPriority === -1 ? Infinity : currentPriority;
            if (insertPriority < current) break;
        }

        queue.splice(i, 0, task);
    }

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
                            const task: Task = {
                                resolve,
                                reject,
                                fn: originalMethod.bind(this),
                                args,
                                name: key,
                            };
                            insertByPriority(task);
                            next();
                        });
                    },
                });
            }
        }
    };
}
