import { autoLoginLensAccounts } from '@/providers/lens/autoLoginLensAccounts.js';
import type { Account } from '@/providers/types/Account.js';

const cachedTasks = new Map<string, Promise<Account[] | undefined>>();

interface Options {
    fireflyAccountId: string;
    forceUseCache?: boolean;
}

export async function autoLoginLensAccountsInSignup({ fireflyAccountId, forceUseCache = false }: Options) {
    if (forceUseCache || cachedTasks.has(fireflyAccountId)) {
        return cachedTasks.get(fireflyAccountId);
    }

    const task = autoLoginLensAccounts({ updateStore: false });
    cachedTasks.set(fireflyAccountId, task);

    return task;
}

export function clearAutoLoginLensCache() {
    cachedTasks.clear();
}
