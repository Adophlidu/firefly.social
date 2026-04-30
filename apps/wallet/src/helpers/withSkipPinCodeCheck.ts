import { skipPinCodeAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

export async function withSkipPinCodeCheck<T>(callback: () => Promise<T>): Promise<T> {
    try {
        store.set(skipPinCodeAtom, true);
        return await callback();
    } finally {
        store.set(skipPinCodeAtom, false);
    }
}
