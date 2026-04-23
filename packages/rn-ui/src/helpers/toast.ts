import { store } from '@/store';
import { toastAtom } from '@/store/global';
import type { ToastFn } from '@/types/ui';

export const toast: ToastFn = (options) => {
    const toastMessage = store.get(toastAtom)?.toast;
    if (typeof toastMessage === 'function') {
        toastMessage(options);
    }
};
