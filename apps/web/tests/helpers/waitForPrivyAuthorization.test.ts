import { afterEach, describe, expect, it } from 'vitest';

import { waitForAuthorization } from '@/helpers/waitForPrivyAuthorization.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

describe('waitForAuthorization', () => {
    afterEach(() => {
        useFireflyWalletStore.getState().setIsAuthorized(false);
    });

    it('resolves immediately when already authorized', async () => {
        useFireflyWalletStore.getState().setIsAuthorized(true);
        await expect(waitForAuthorization()).resolves.toBeUndefined();
    });

    it('resolves once the wallet becomes authorized', async () => {
        useFireflyWalletStore.getState().setIsAuthorized(false);

        let resolved = false;
        const pending = waitForAuthorization().then(() => {
            resolved = true;
        });

        // Not authorized yet: the promise stays pending.
        await Promise.resolve();
        expect(resolved).toBe(false);

        useFireflyWalletStore.getState().setIsAuthorized(true);
        await pending;
        expect(resolved).toBe(true);
    });
});
