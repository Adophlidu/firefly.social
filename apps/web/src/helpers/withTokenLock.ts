import { bom } from '@dimensiondev/utils';

/** Runs `task` under an origin-wide exclusive lock; unguarded if Web Locks is unavailable. */
export function withTokenLock<T>(name: string, task: () => Promise<T>): Promise<T> {
    const locks = bom.navigator?.locks;
    if (!locks) return task();
    return locks.request(name, task);
}
